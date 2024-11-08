const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { ensureSuperAdmin, isAuthenticated } = require('../middleware/auth');

// Protect all admin routes
router.use(isAuthenticated);

// Route to Dashboard
router.get('/', (req, res) => {
    res.render('admin/admin_dashboard');
});


// Admin Route
router.get('/admin', ensureSuperAdmin, (req, res) => res.render('admin/superadmin'));


// Route to fetch dashboard data
router.get('/data', async (req, res) => {
    try {
        const totalPatientsResult = await pool.query(`
        SELECT
    COUNT(DISTINCT p.patient_id) AS patients_this_month,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM appointment WHERE status = 'Completed') AS total_appointments
FROM
    appointment a
INNER JOIN patients p ON a.patient_id = p.patient_id
WHERE
    DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY
    DATE_TRUNC('month', a.appointment_date);`);
        const totalPatients = totalPatientsResult.rows[0];


        const returningPatientsResult = await pool.query("SELECT COUNT(*) AS total FROM appointment WHERE visit_type != 'first'");
        const returningPatients = returningPatientsResult.rows[0].total;

        const upcomingAppointmentsResult = await pool.query(`
        SELECT
             a.appointment_id, a.appointment_date, a.status, a.treatment_type, 
             p.name AS patient_name, d.name AS doctor_name
            FROM appointment a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_date >= CURRENT_DATE
              AND a.status != 'Completed'
            ORDER BY a.appointment_date ASC
        `);
        const upcomingAppointments = upcomingAppointmentsResult.rows;

        // Fetch completed appointments by month for graph data
        const completedAppointmentsByMonthResult = await pool.query(`
            SELECT EXTRACT(MONTH FROM appointment_date) AS month, COUNT(appointment_id) AS count
            FROM appointment
            WHERE status = 'Completed'
            GROUP BY month
            ORDER BY month ASC
        `);

        // Format data for the frontend graph
        const completedAppointmentsByMonth = completedAppointmentsByMonthResult.rows.map(record => ({
            month: record.month,
            count: record.count
        }));

        const pendingAppointmentResult = await pool.query(`SELECT
    a.appointment_id,
    p.name AS patient_name,
    a.treatment_type,
    a.appointment_date
FROM
    appointment a
INNER JOIN patients p ON a.patient_id = p.patient_id
WHERE
    a.status = 'Pending';`)

        const pendingAppointment = pendingAppointmentResult.rows

        // Prepare data response
        res.json({
            totalPatients,
            returningPatients,
            upcomingAppointments,
            pendingAppointment,
            completedAppointmentsByMonth: {
                months: completedAppointmentsByMonth.map(d => d.month),
                completedCounts: completedAppointmentsByMonth.map(d => d.count)
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Error fetching dashboard data');
    }
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
