from flask import Flask, request, jsonify, Response
import csv
from io import StringIO
from flask_cors import CORS
from dotenv import load_dotenv
import os
from twilio.rest import Client 
import firebase_admin
from firebase_admin import credentials, auth
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from google.cloud import storage
from io import BytesIO
import base64
from bson.decimal128 import Decimal128
from flask_mail import Mail, Message
import threading
import time
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import json
import gzip

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME') 
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')  

mail = Mail(app)

# Twilio client setup
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')

# Check if credentials are available
if not account_sid or not auth_token:
    raise ValueError("Twilio credentials are missing. Please check your .env file.")

# Create Twilio client
twilio_client = Client(account_sid, auth_token)
twilio_phone_number = os.getenv('TWILIO_PHONE_NUMBER')

# Load recipient numbers from environment variable and split into a list
twilio_recipient_numbers = os.getenv('TWILIO_RECIPIENT_NUMBERS', '').split(',')


# Firebase Admin SDK settings
cred = credentials.Certificate('/etc/secrets/Firebaseadminsdk.json')
firebase_admin.initialize_app(cred)

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    # This endpoint should only receive the ID token from the client and verify it
    id_token = request.json.get('idToken')
    try:
        # Verify the ID token and extract user info
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        return jsonify({'message': 'User authenticated', 'uid': uid}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

# Google Signin
@app.route('/api/auth/googleSignIn', methods=['POST'])
def google_sign_in():
    id_token = request.json['idToken']
    try:
        # Verify the ID token and get the user's Firebase UID
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        return jsonify({'message': 'Google sign-in successful', 'uid': uid}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to authenticate with Google', 'details': str(e)}), 401

# MongoDB Data API settings
MONGODB_DATA_API_URL = "https://us-east-2.aws.data.mongodb-api.com/app/data-kjhpe/endpoint/data/v1"
MONGODB_DATA_API_KEY = os.getenv("MONGODB_DATA_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = "pilotstudy2024"
COLLECTION_NAME = "collectedsamples"

# Google Cloud Storage Configuration
GCS_BUCKET = os.getenv("GCS_BUCKET")
GCS_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Recipient email address for notifications
RECIPIENT_EMAILS = os.getenv('RECIPIENT_EMAILS', '').split(',')
MAIL_FROM_ADDRESS = os.getenv('MAIL_FROM_ADDRESS')

# Initialize GCS client
storage_client = storage.Client.from_service_account_json(GCS_CREDENTIALS)
bucket = storage_client.bucket(GCS_BUCKET)

headers = {
    "Content-Type": "application/json",
    "Access-Control-Request-Headers": "*",
    "api-key": MONGODB_DATA_API_KEY,
}

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

def backup_database():
    try:
        # Generate a timestamp for the backup file name
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file_name = f"backup_{timestamp}.json.gz"
        
        # Fetch all documents from the collection
        documents = list(collection.find({}, {'_id': False}))
        
        # Convert documents to JSON and compress
        json_data = json.dumps(documents)
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        
        # Upload the compressed backup to Google Cloud Storage
        backup_blob = bucket.blob(f"database_backups/{backup_file_name}")
        backup_blob.upload_from_string(compressed_data, content_type='application/gzip')
        
        print(f"Database backup completed and uploaded to GCS: {backup_file_name}")
        
        # Send email notification
        # subject = "Database Backup Completed"
        # body = f"The database backup has been completed and uploaded to Google Cloud Storage: {backup_file_name}"
        # send_email(subject, body)
        
    except Exception as e:
        error_message = f"Database backup failed: {str(e)}"
        print(error_message)
        # send_email("Database Backup Failed", error_message)

# Initialize the scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(
    backup_database,
    trigger=CronTrigger(hour=22, minute=0, timezone=pytz.timezone('US/Eastern')),
    id='database_backup_job',
    name='Daily database backup at 10 PM EST',
    replace_existing=True
)

# Start the scheduler
scheduler.start()

# Function to send email notification
def send_email(subject, body):
    msg = Message(subject, sender=MAIL_FROM_ADDRESS, recipients=RECIPIENT_EMAILS)
    msg.body = body
    try:
        mail.send(msg)
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")
        
def send_sms(to_numbers, message_body):
    for number in to_numbers:
        try:
            message = twilio_client.messages.create(
                body=message_body,
                from_=twilio_phone_number,
                to=number.strip()  # Strip any extra spaces
            )
            print(f"Message sent successfully to {number}. SID: {message.sid}")
        except Exception as e:
            print(f"Failed to send message to {number}: {e}")

# Global dictionary to store sample timers
sample_timers = {}

def check_and_update_samples():
    while True:
        current_time = datetime.now(pytz.utc)
        samples_to_update = collection.find({
            "status": "In Process",
            "expected_completion_time": {"$lte": current_time}
        })

        for sample in samples_to_update:
            update_sample_status(sample['chip_id'], "Ready for Pickup")

        time.sleep(60) # Check every minute

# Start the background task
threading.Thread(target=check_and_update_samples, daemon=True).start()

def update_sample_status(chip_id, new_status):
    update_result = collection.update_one(
        {"chip_id": chip_id},
        {"$set": {"status": new_status}}
    )
    if update_result.modified_count == 1:
        subject = f"Sample Status Updated: {new_status}"
        body = f"Sample with chip ID {chip_id} has been updated to '{new_status}'. Please check the dashboard at https://onebreathpilot.netlify.app for more details."
        send_email(subject, body)

@app.route('/samples', methods=['GET'])
def samples():
    # Endpoint to get samples with certain statuses.
    try:
        sample_data = get_samples()
        return jsonify(sample_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# @app.route('/update_sample', methods=['POST'])
# def update_sample():
#     # Endpoint to update a sample based on 'chipID'.
#     try:
#         # Extracting data from the request
#         update_data = request.json
#         chip_id = update_data.get('chip_id')
#         status = update_data.get('status')
#         location = update_data.get('location')

#         # Check if 'chip_id' and 'status' are provided
#         if not chip_id or not status:
#             return jsonify({"error": "Missing chipID or status in the submitted data."}), 400

#         # Finding and updating the document in the database
#         update_result = collection.update_one(
#             {"chip_id": chip_id},
#             {"$set": update_data}
#         )

#         # Check if the document was successfully updated
#         if update_result.modified_count == 1:
#             # Only send email if the status is "In Process" or "Ready for Pickup"
#             if status in ["In Process", "Ready for Pickup"]:
#                 subject = f"Sample Status Updated: {status}"
#                 body = f"Sample with chip ID {chip_id} has been updated to '{status}' at '{location}'. Please check the dashboard at https://onebreathpilot.netlify.app for more details."
#                 send_email(subject, body)
                
#                  # SMS Notification
#                 # sms_body = f"Sample with chip ID {chip_id} is now '{status}' at '{location}'. Please check the dashboard at https://onebreathpilot.netlify.app for more details."
#                 # send_sms(twilio_recipient_numbers, sms_body)

#             return jsonify({"success": True, "message": "Sample updated successfully."}), 200
#         else:
#             return jsonify({"success": False, "message": "No sample found with the given chipID or no new data to update."}), 404

#     except KeyError:
#         return jsonify({"error": "Missing chipID in the submitted data."}), 400
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/update_sample', methods=['POST'])
def update_sample():
    try:
        update_data = request.json
        chip_id = update_data.get('chip_id')
        status = update_data.get('status')
        location = update_data.get('location')

        if not chip_id or not status:
            return jsonify({"error": "Missing chipID or status in the submitted data."}), 400

        # If status is "In Process", set the expected completion time
        if status == "In Process":
            update_data['expected_completion_time'] = datetime.now(pytz.utc) + timedelta(hours=2)

        update_result = collection.update_one(
            {"chip_id": chip_id},
            {"$set": update_data}
        )

        if update_result.modified_count == 1:
            if status in ["In Process", "Ready for Pickup"]:
                subject = f"Sample Status Updated: {status}"
                body = f"Sample with chip ID {chip_id} has been updated to '{status}' at '{location}'. Please check the dashboard at https://onebreathpilot.netlify.app for more details."
                send_email(subject, body)
                
            return jsonify({"success": True, "message": "Sample updated successfully."}), 200
        else:
            return jsonify({"success": False, "message": "No sample found with the given chipID or no new data to update."}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update_patient_info', methods=['POST'])
def update_patient_info():
    try:
        data = request.json
        chip_id = data.get('chipID')
        patient_info = data.get('patientInfo')
        
        if not chip_id or not patient_info:
            return jsonify({"success": False, "message": "Invalid data."}), 400
        
        client = MongoClient(MONGO_URI)
        db = client.get_database(DATABASE_NAME)
        patient_collection = db.get_collection(COLLECTION_NAME)
        
        # Upsert the patient info based on chip ID
        patient_collection.update_one(
            {"chip_id": chip_id},
            {"$set": patient_info},
            upsert=True
        )

        return jsonify({"success": True, "message": "Patient information updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/generate_presigned_url', methods=['POST'])
def generate_presigned_url():
    try:
        file_name = request.json.get('file_name')
        if not file_name:
            return jsonify({"success": False, "message": "Missing file name in the request."}), 400

        secure_file_name = secure_filename(file_name)
        blob = bucket.blob(secure_file_name)
        presigned_url = blob.generate_signed_url(expiration=7200, method='GET')

        return jsonify({"success": True, "url": presigned_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def upload_blob_from_memory(destination_blob_name, file_stream):
    """Uploads a file to the bucket."""
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_file(file_stream)
    print(f"File uploaded to {destination_blob_name}.")

@app.route('/upload_from_memory', methods=['POST'])
def upload_from_memory():
    try:
        data = request.get_json()
        destination_blob_name = data['destination_blob_name']
        image_data = data['source_file_name']

        # Convert base64 image data to BytesIO
        image_data = base64.b64decode(image_data.split(",")[1])
        image_stream = BytesIO(image_data)
        
        upload_blob_from_memory(destination_blob_name, image_stream)

        return jsonify({'success': True, 'message': 'File uploaded successfully'}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def convert_decimal128(sample):
    for key, value in sample.items():
        if isinstance(value, Decimal128):
            sample[key] = float(value.to_decimal())  # Convert Decimal128 to float
        elif isinstance(value, dict):
            sample[key] = convert_decimal128(value)  # Recursively convert nested documents
        elif isinstance(value, list):
            sample[key] = [convert_decimal128(item) if isinstance(item, dict) else item for item in value]
    return sample

@app.route('/api/completed_samples', methods=['GET'])
def get_completed_samples():
    all_samples = get_samples()

    # Convert all Decimal128 fields to JSON serializable formats (floats)
    completed_samples = [convert_decimal128(sample) for sample in all_samples if sample["status"] == "Complete"]

    return jsonify(completed_samples), 200

@app.route('/upload_document_metadata', methods=['POST'])
def upload_document_metadata():
    try:
        chip_id = request.json.get('chip_id')
        document_urls = request.json.get('document_urls')
        if not chip_id or not document_urls:
            return jsonify({"success": False, "message": "Missing chipID or document URLs in the request."}), 400
        
        sample = collection.find_one({"chip_id": chip_id})
        if not sample:
            return jsonify({"success": False, "message": "No sample found with the given chipID."}), 404

        update_result = collection.update_one(
            {"chip_id": chip_id},
            {"$set": {"document_urls": document_urls}}
        )

        if update_result.modified_count >= 0:
            return jsonify({"success": True, "message": "Document URLs added to the sample successfully."}), 200
        else:
            return jsonify({"success": False, "message": "Failed to add the document URLs to the sample."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_samples():
    statuses = ["In Process", "Ready for Pickup", "Picked up. Ready for Analysis", "Complete"]
    query_result = collection.find({"status": {"$in": statuses}}, {"_id": 0})
    samples = list(query_result)
    # Ensure all Decimal128 fields are converted before returning
    samples = [convert_decimal128(sample) for sample in samples]
    return samples

@app.route('/download_dataset', methods=['GET'])
def download_dataset():
    try:
        # Fetch the completed samples from MongoDB
        samples = collection.find({"status": "Complete"}, {"_id": 0}).sort("timestamp", 1)

        # Create an in-memory CSV file
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Chip ID', 'Batch', 'Mfg. Date', 'Patient ID', 'Final Volume (mL)', 'Avg. CO2 (%)', 'Error Code', 'Patient Form Uploaded'])
        
        for sample in samples:
            formatted_date = sample['timestamp'].split('T')[0]
            parts = formatted_date.split('-')
            short_year = parts[0][-2:]
            short_date = f"{parts[1]}/{parts[2]}/{short_year[1]}"
            
            formatted_mfg = sample['mfg_date'].strftime('%Y-%m-%d')
            mfg_parts = formatted_mfg.split('-')
            mfg_short_year = mfg_parts[0][-2:]
            mfg_short_date = f"{mfg_parts[1]}/{mfg_parts[2]}/{mfg_short_year}"
            
            writer.writerow([
                short_date,
                sample['chip_id'],
                sample['batch_number'],
                mfg_short_date,
                sample.get('patient_id', 'N/A'),
                f"{sample['final_volume']}",
                f"{sample['average_co2']}",
                sample.get('error', 'N/A'), 
                'Yes' if sample.get('document_urls') else 'No'
            ])
        
        # Move the buffer cursor to the beginning
        output.seek(0)
        
        # Return the CSV file as a response
        return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment;filename=completed_samples.csv"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500