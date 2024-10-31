const express = require('express');
const router = express.Router();
const pool = require('../models/db');



// Route to Dashboard
router.get('/', (req, res) => {
    res.render('admin/admin_dashboard');
});

// Route to get patients
const patientRoutes = require("./patients")
router.use("/patients", patientRoutes)

// Import Services routes
const servicesRoutes = require("./services")
router.use("/services", servicesRoutes);

const blogsRoutes = require('./blogs'); // Import the blogs routes
router.use('/blogs', blogsRoutes); // BLog route

// Doctors routes
const doctorsRoute = require("./doctors")
router.use("/doctor", doctorsRoute)

// Appointments Route 
const appointmentRoutes = require('./appointments');
router.use('/appointments', appointmentRoutes);


module.exports = router;
