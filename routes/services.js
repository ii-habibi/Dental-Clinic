const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');

// Admin routes
router.get('/', servicesController.getAllServices);
router.post('/add', servicesController.addService);
router.get('/edit/:id', servicesController.renderEditServiceForm);
router.put('/edit/:id', servicesController.updateService);
router.delete('/:id', servicesController.deleteService);

// User routes
router.get('/user', servicesController.getUserServices);

module.exports = router;
