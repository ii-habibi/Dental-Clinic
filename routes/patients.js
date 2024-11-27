// routes/patients.js
const express = require('express');
const router = express.Router();
const patientsController = require('../controllers/patientsController'); // Import the controller

// Define routes and map them to controller methods
router.get('/', patientsController.getAllPatients);
router.get('/search', patientsController.searchPatients);
router.post('/', patientsController.addPatient);
router.get('/delete/:id', patientsController.deletePatient);
router.patch('/:id', patientsController.updatePatient);

module.exports = router;
