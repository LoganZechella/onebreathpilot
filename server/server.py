from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB Data API settings
MONGODB_DATA_API_URL = "https://us-east-2.aws.data.mongodb-api.com/app/data-kjhpe/endpoint/data/v1"
MONGODB_DATA_API_KEY = os.getenv("MONGODB_DATA_API_KEY")  # Add your MongoDB Data API Key to your environment variables
DATABASE_NAME = "pilotstudy2024"  # Replace with your database name
COLLECTION_NAME = "collectedsamples"  # Replace with your collection name

headers = {
    "Content-Type": "application/json",
    "Access-Control-Request-Headers": "*",
    "api-key": MONGODB_DATA_API_KEY,
}

# Proper Storage of Sample in MongoDB
@app.route('/collectedsamples', methods=['POST'])
def add_sample():
    try:
        sample_data = request.json
        payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "document": sample_data
        }
        response = requests.post(f"{MONGODB_DATA_API_URL}/action/insertOne", headers=headers, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data["insertedId"]:
            return jsonify({"message": "Sample added successfully", "sample_id": response_data["insertedId"]}), 201
        else:
            return jsonify({"error": "Failed to add sample"}), 500
    except Exception as e:
        print("Error adding sample to MongoDB:", e)
        return jsonify({"error": "Failed to add sample", "details": str(e)}), 500

# Get last sample added to MongoDB
@app.route('/latestsample', methods=['GET'])
def get_sample():
    try:
        payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "sort": {"_id": -1},
            "limit": 1
        }
        response = requests.post(f"{MONGODB_DATA_API_URL}/action/find", headers=headers, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data["documents"]:
            return jsonify({"message": "Latest sample retrieved successfully", "sample": response_data["documents"][0]}), 200
        else:
            return jsonify({"error": "No samples found"}), 404
    except Exception as e:
        print("Error retrieving sample from MongoDB:", e)
        return jsonify({"error": "Failed to retrieve sample", "details": str(e)}), 500


# Update sample in MongoDB
@app.route('/updateLatestSample', methods=['POST'])
def update_latest_sample():
    try:
        # Retrieve the latest sample's ID
        find_payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "sort": {"_id": -1},
            "limit": 1
        }
        find_response = requests.post(f"{MONGODB_DATA_API_URL}/action/find", headers=headers, json=find_payload)
        find_response_data = find_response.json()
        
        if find_response.status_code != 200 or not find_response_data["documents"]:
            return jsonify({"error": "No samples found to update"}), 404

        latest_sample_id = find_response_data["documents"][0]["_id"]
        
        # Update the latest sample with new data from request
        update_data = request.json  # Assuming the request body contains the update data
        update_payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "filter": {"_id": latest_sample_id},  # Filter document by ID
            "update": {
                "$set": update_data  # Update operation
            }
        }
        update_response = requests.post(f"{MONGODB_DATA_API_URL}/action/updateOne", headers=headers, json=update_payload)
        update_response_data = update_response.json()

        if update_response.status_code == 200 and update_response_data["modifiedCount"] == 1:
            return jsonify({"message": "Latest sample updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update the latest sample"}), 500
    except Exception as e:
        print("Error updating sample in MongoDB:", e)
        return jsonify({"error": "Failed to update sample", "details": str(e)}), 500
    
# Get In Process Samples
@app.route('/samples/inprocess', methods=['GET'])
def get_in_process_samples():
    try:
        payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "filter": {
                "status": "In Process"
            }
        }
        response = requests.post(f"{MONGODB_DATA_API_URL}/action/find", headers=headers, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data["documents"]:
            # Convert from MongoDB's format if necessary
            return jsonify({"samples": response_data["documents"]}), 200
        else:
            return jsonify({"message": "No in-process samples found"}), 404
    except Exception as e:
        print(f"Error fetching in-process samples: {e}")
        return jsonify({"error": "Failed to fetch in-process samples", "details": str(e)}), 500

@app.route('/updateSample/<chipID>', methods=['POST'])
def update_sample(chipID):
    try:
        update_data = request.json
        update_payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "filter": {"chipID": chipID},
            "update": {"$set": update_data}
        }
        response = requests.post(f"{MONGODB_DATA_API_URL}/action/updateOne", json=update_payload, headers=headers)
        if response.status_code == 200:
            return jsonify({"message": "Sample updated successfully"}), 200
        else:
            return jsonify({"error": "Failed to update sample"}), response.status_code
    except Exception as e:
        return jsonify({"error": "Server error", "details": str(e)}), 500
    

# Get Ready for Analysis Samples
@app.route('/samples/analysis', methods=['GET'])
def get_ready_for_analysis_samples():
    try:
        payload = {
            "dataSource": "Cluster0",
            "database": DATABASE_NAME,
            "collection": COLLECTION_NAME,
            "filter": {
                "status": "Picked up, ready for elution and analysis."
            }
        }
        response = requests.post(f"{MONGODB_DATA_API_URL}/action/find", headers=headers, json=payload)
        response_data = response.json()
        
        if response.status_code == 200 and response_data["documents"]:
            # Convert from MongoDB's format if necessary
            return jsonify({"samples": response_data["documents"]}), 200
        else:
            return jsonify({"message": "No in-process samples found"}), 404
    except Exception as e:
        print(f"Error fetching in-process samples: {e}")
        return jsonify({"error": "Failed to fetch in-process samples", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)