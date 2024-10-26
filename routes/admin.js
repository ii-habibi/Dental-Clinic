const express = require('express');
const router = express.Router(); 
const pool = require('../models/db');



// Route to Dashboard
router.get('/', (req, res) => {
    res.render('admin_dashboard');
});

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

// Test route to check database connection
router.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`Database connected: ${result.rows[0].now}`);
    } catch (err) {
        console.error(err);
        res.send('Error connecting to the database');
    }
});



module.exports = router;
