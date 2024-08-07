from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, auth
from pymongo import MongoClient
from werkzeug.utils import secure_filename
from google.cloud import storage
from io import BytesIO
import base64

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Firebase Admin SDK settings
cred = credentials.Certificate('/etc/secrets/Firebaseadminsdk.json')
# cred = credentials.Certificate('server/Firebaseadminsdk.json')
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

def get_samples():
    # Fetches samples from the database with specified statuses.
    statuses = ["In Process", "Ready for Pickup", "Picked up. Ready for Analysis"]
    query_result = collection.find({"status": {"$in": statuses}}, {"_id": 0})
    samples = list(query_result)
    # print(samples)
    return samples

@app.route('/samples', methods=['GET'])
def samples():
    # Endpoint to get samples with certain statuses.
    try:
        sample_data = get_samples()
        return jsonify(sample_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/update_sample', methods=['POST'])
def update_sample():
    # Endpoint to update a sample based on 'chipID'.
    try:
        # Extracting data from request
        update_data = request.json
        chip_id = update_data['chip_id']
        
        # Finding and updating the document in the database
        update_result = collection.update_one(
            {"chip_id": chip_id},
            {"$set": update_data}
        )
        
        # Check if the document was successfully updated
        if update_result.modified_count == 1:
            return jsonify({"success": True, "message": "Sample updated successfully."}), 200
        else:
            return jsonify({"success": False, "message": "No sample found with the given chipID or no new data to update."}), 404
        
    except KeyError:
        return jsonify({"error": "Missing chipID in the submitted data."}), 400
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
        
        # Replace '<DB_CONNECTION_STRING>' with your MongoDB connection string
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