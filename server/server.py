from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid
import os
import json
from bson.json_util import dumps

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://onebreathpilot.netlify.app"}})


# MongoDB settings
MONGO_URI = os.getenv("MONGO_URI")  # Add your MongoDB URI to your environment variables
DATABASE_NAME = "pilotstudy2024"  # Replace with your database name
COLLECTION_NAME = "collectedsamples"  # Replace with your collection name

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Proper Storage of Sample in MongoDB

@app.route('/collectedsamples', methods=['POST'])
def add_sample():
    try:
        sample_data = request.json
        result = collection.insert_one(sample_data)
        if result.inserted_id:
            return jsonify({"message": "Sample added successfully", "sample_id": str(result.inserted_id)}), 201
        else:
            return jsonify({"error": "Failed to add sample"}), 500
    except Exception as e:
        print("Error adding sample to MongoDB:", e)
        return jsonify({"error": "Failed to add sample", "details": str(e)}), 500
# Get last sample added to MongoDB
@app.route('/latestsample', methods=['GET'])
def get_sample():
    try:
        # Sort by '_id' in descending order and get the first document
        sample = collection.find_one(sort=[('_id', -1)])
        if sample:
            # Convert the MongoDB document to a JSON string
            return jsonify({"message": "Latest sample retrieved successfully", "sample": dumps(sample)}), 200
        else:
            return jsonify({"error": "No samples found"}), 404
    except Exception as e:
        print("Error retrieving sample from MongoDB:", e)
        return jsonify({"error": "Failed to retrieve sample", "details": str(e)}), 500


# Temporary storage for unconfirmed samples
unconfirmed_samples = {}    
@app.route('/temp_samples', methods=['POST'])
def store_temp_sample():
    try:
        sample_data = request.json
        # Fallback parsing if sample_data is None or not parsed as expected
        if sample_data is None:
            try:
                sample_data = json.loads(request.data)
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid JSON payload'}), 400

        if not isinstance(sample_data, dict):
            return jsonify({'error': 'Expected object in request payload'}), 400

        sample_id = str(uuid.uuid4())
        sample_data['sample_id'] = sample_id
        unconfirmed_samples[sample_id] = sample_data
        return jsonify(sample_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get a single unconfirmed sample by ID
    
@app.route('/temp_samples/<sample_id>', methods=['GET'])
def get_temp_sample(sample_id):
    sample_data = unconfirmed_samples.get(sample_id)
    if sample_data:
        return jsonify(sample_data), 200
    else:
        return jsonify({'error': 'Sample not found'}), 404

# if __name__ == '__main__':
#     app.run(debug=True)
