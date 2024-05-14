from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, auth
from pymongo import MongoClient
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Firebase Admin SDK settings
cred = credentials.Certificate('/etc/secrets/pilotdash-2466b-firebase-adminsdk-26rdi-11a0d7418d.json')
# cred = credentials.Certificate('server/pilotdash-2466b-firebase-adminsdk-26rdi-11a0d7418d.json')
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
        patient_info = request.json
        chip_id = patient_info.get('chip_id')
        
        if not chip_id:
            return jsonify({"error": "Missing chipID in the submitted data."}), 400
        
        # Locate the sample based on chip_id
        sample = collection.find_one({"chip_id": chip_id})
        
        if not sample:
            return jsonify({"success": False, "message": "No sample found with the given chipID."}), 404
        
        # Append patient info to the sample's existing data
        update_result = collection.update_one(
            {"chip_id": chip_id},
            {"$set": {"patient_info": patient_info}}
        )
        
        if update_result.modified_count == 1:
            return jsonify({"success": True, "message": "Patient information added successfully to the sample."}), 200
        else:
            return jsonify({"success": False, "message": "Failed to add patient information to the sample."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload_document', methods=['POST'])
def upload_document():
    try:
        # Extract the chip_id from the form data
        chip_id = request.form.get('chip_id')
        if not chip_id:
            return jsonify({"success": False, "message": "Missing chipID in the request."}), 400

        # Locate the sample based on chip_id
        sample = collection.find_one({"chip_id": chip_id})
        if not sample:
            return jsonify({"success": False, "message": "No sample found with the given chipID."}), 404

        if 'document' not in request.files:
            return jsonify({"success": False, "message": "No document part in the request."}), 400

        file = request.files['document']
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected."}), 400

        if file:
            filename = secure_filename(file.filename)
            save_path = os.path.join('/path/to/save/documents', filename)
            file.save(save_path)

            # Append the document path to the sample's existing data
            update_result = collection.update_one(
                {"chip_id": chip_id},
                {"$set": {"document_path": save_path}}
            )

            if update_result.modified_count == 1:
                return jsonify({"success": True, "message": "Document uploaded and added to the sample successfully.", "path": save_path}), 200
            else:
                return jsonify({"success": False, "message": "Failed to add the document to the sample."}), 500
        else:
            return jsonify({"success": False, "message": "Document upload failed."}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True, host='127.0.0.1', port=8080, use_reloader=False)