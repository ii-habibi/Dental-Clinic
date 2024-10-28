// routes/user.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // Adjust the path as necessary


// Route to display services and blogs on the user side
router.get('/', async (req, res) => {
    try {
        // Fetch services from the database
        const servicesResult = await pool.query('SELECT * FROM Services');
        const services = servicesResult.rows; // Get the rows for services

        // Fetch blogs from the database
        const blogsResult = await pool.query('SELECT * FROM Blog ORDER BY created_at DESC');
        const blogs = blogsResult.rows; // Get the rows for blogs


        // Fetch all doctors from the database
        const doctorResult = await pool.query('SELECT * FROM doctors');
        const doctors = doctorResult.rows


        // Render the home page and pass to the template
        res.render('user/home', { services, blogs, doctors });

    } catch (error) {
        console.error('Error fetching data for user home:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
