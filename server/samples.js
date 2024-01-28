
const express = require('express');
const router = express.Router();
const samplesController = require('../controllers/samplesController');

// Route to add a new sample
router.post('/samples', samplesController.addSample);

// Route to update sample status
router.put('/samples/:id/status', samplesController.updateSampleStatus);

// Route to confirm sample pickup
router.put('/samples/:id/pickup', samplesController.confirmSamplePickup);

// Route to generate and send a shipping label
router.post('/samples/:id/shipping-label', samplesController.generateShippingLabel);

module.exports = router;
