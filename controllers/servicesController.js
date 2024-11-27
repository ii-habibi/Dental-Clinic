const pool = require('../models/db');

// Get all services for admin
exports.getAllServices = async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services');
        res.render('admin/services_combined', {
            view: 'list',
            pageTitle: 'Services',
            services: services.rows,
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Get all services for users
exports.getUserServices = async (req, res) => {
    try {
        const services = await pool.query('SELECT * FROM Services');
        res.render('user/services', { services: services.rows });
    } catch (error) {
        console.error('Error fetching services for user:', error);
        res.status(500).send('Internal Server Error');
    }
};


// Add a new service
exports.addService = async (req, res) => {
    const { name, description, price } = req.body;
    try {
        await pool.query('INSERT INTO Services (name, description, price) VALUES ($1, $2, $3)', [name, description, price]);
        res.redirect('/dashboard/services');
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Render the edit service form
exports.renderEditServiceForm = async (req, res) => {
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
            service,
        });
    } catch (error) {
        console.error('Error fetching service for edit:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Update a service
exports.updateService = async (req, res) => {
    const serviceId = req.params.id;
    const { name, description, price } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Services SET name = $1, description = $2, price = $3 WHERE service_id = $4',
            [name, description, price, serviceId]
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
};

// Delete a service
exports.deleteService = async (req, res) => {
    const serviceId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM Services WHERE service_id = $1', [serviceId]);
        if (result.rowCount > 0) {
            res.status(200).send({ message: 'Service deleted successfully' });
        } else {
            res.status(404).send({ message: 'Service not found' });
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).send('Internal Server Error');
    }
};
