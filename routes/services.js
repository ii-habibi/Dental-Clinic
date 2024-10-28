const express = require('express');
const router = express.Router();
const pool = require('../models/db');



// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services'); // Ensure this matches your database setup
        res.render('admin/services_combined', {
            view: 'list',
            pageTitle: 'Services',
            services: services.rows
        });
    } catch (error) {
        console.error('Error fetching services:', error); // Log the error for debugging
        res.status(500).send('Internal Server Error'); // Send a 500 error response
    }
});

// Route to display services for users
router.get('/user', async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services'); // Fetch all services
        res.render('user/services', { services: services.rows }); // Render the user services page
    } catch (error) {
        console.error('Error fetching services for user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to render the add service form
router.get('/add', (req, res) => {
    res.render('admin/services_combined', {
        view: 'add',
        pageTitle: 'Add Service'
    });
});

// Route to handle the addition of a new service
router.post('/', async (req, res) => {
    const { name, description, price } = req.body; // Get the service name and description from the request body
    try {
        await pool.query('INSERT INTO Services (name, description, price) VALUES ($1, $2, $3)', [name, description, price]);
        res.redirect('/dashboard/services'); // Redirect to the services list after adding
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display the edit service form
router.get('/edit/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const result = await pool.query('SELECT * FROM Services WHERE service_id = $1', [serviceId]);
        const service = result.rows[0];

        if (!service) {
            return res.status(404).send('Service not found');
        }

        res.render('admin/services_combined', {
            view: 'edit',
            pageTitle: 'Edit Service',
            service: service
        });
    } catch (error) {
        console.error('Error fetching service for edit:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the update form submission
router.post('/edit/:id', async (req, res) => {
    const serviceId = req.params.id;
    const { name, description, price } = req.body; // Get data from the form

    try {
        const result = await pool.query(
            'UPDATE Services SET name = $1, description = $2, price = $3 WHERE service_id = $4',
            [name, description, price, serviceId] // Update the service
        );
        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Service updated successfully' });
        } else {
            res.status(404).send({ message: 'Service not found' });
        }

    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle the deletion of a service
router.delete('/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM services WHERE service_id = $1', [serviceId]);

        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Service deleted successfully' });
        } else {
            res.status(404).send({ message: 'Service not found' });
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;