
const db = require('../models/db');

const addSample = async (req, res) => {
    try {
        const { patientID, chipID, collectionLocation } = req.body;
        const timestamp = new Date();

        const query = 'INSERT INTO Samples (PatientID, ChipID, CollectionLocation, Status, StatusTimestamps) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const values = [patientID, chipID, collectionLocation, 'in process', JSON.stringify({added: timestamp})];

        const result = await db.query(query, values);
        res.status(201).json({
            message: 'Sample added successfully',
            sample: result.rows[0]
        });
    } catch (error) {
        console.error('Error in addSample:', error);
        res.status(500).json({ message: 'Error adding sample' });
    }
};


const updateSampleAtPickup = async (req, res) => {
    try {
        const { sampleID, finalVolume, avgCO2, errorCode } = req.body;
        const pickupTimestamp = new Date();

        const query = 'UPDATE Samples SET FinalVolume = $1, AvgCO2 = $2, ErrorCode = $3, PickupTimestamp = $4 WHERE SampleID = $5 RETURNING *';
        const values = [finalVolume, avgCO2, errorCode, pickupTimestamp, sampleID];

        const result = await db.query(query, values);
        res.status(200).json({
            message: 'Sample updated successfully at pickup',
            sample: result.rows[0]
        });
    } catch (error) {
        console.error('Error in updateSampleAtPickup:', error);
        res.status(500).json({ message: 'Error updating sample at pickup' });
    }
};
