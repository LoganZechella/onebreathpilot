from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB settings
MONGO_URI = os.getenv("MONGO_URI")  # Add your MongoDB URI to your environment variables
DATABASE_NAME = "pilotstudy2024"  # Replace with your database name
COLLECTION_NAME = "collectedsamples"  # Replace with your collection name

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Temporary storage for unconfirmed samples
unconfirmed_samples = {}

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

@app.route('/temp_samples', methods=['POST'])
def store_temp_sample():
    try:
        sample_data = request.json
        sample_id = str(uuid.uuid4())
        unconfirmed_samples[sample_id] = sample_data
        sample_data['sample_id'] = sample_id
        return jsonify(sample_data), 201 
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/temp_samples/<sample_id>', methods=['GET'])
def get_temp_sample(sample_id):
    sample_data = unconfirmed_samples.get(sample_id)
    if sample_data:
        return jsonify(sample_data), 200
    else:
        return jsonify({'error': 'Sample not found'}), 404

# if __name__ == '__main__':
#     app.run(debug=True)
