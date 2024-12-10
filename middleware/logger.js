// helpers/auditLogger.js
const pool = require('../models/db');

/**
 * Log changes to an appointment.
 * @param {number} adminId - The ID of the admin performing the change.
 * @param {number} appointmentId - The appointment affected.
 * @param {string} actionType - The action performed e.g. "CREATE_APPOINTMENT", "UPDATE_APPOINTMENT", "DELETE_APPOINTMENT"
 * @param {object|null} oldValue - The previous state (as JS object).
 * @param {object|null} newValue - The new state (as JS object).
 */
async function logAppointmentChange(adminId, appointmentId, actionType, oldValue, newValue) {
    try {
        await pool.query(
            `INSERT INTO audit_logs (admin_id, appointment_id, action_type, old_value, new_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [adminId, appointmentId, actionType, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null]
        );
    } catch (error) {
        console.error('Error logging appointment change:', error);
    }
}

/**
 * Log expense changes.
 * @param {number} expenseId
 */
async function logExpenseChange(adminId, expenseId, actionType, oldValue, newValue) {
    try {
        await pool.query(
            `INSERT INTO audit_logs (admin_id, expense_id, action_type, old_value, new_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [adminId, expenseId, actionType, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null]
        );
    } catch (error) {
        console.error('Error logging expense change:', error);
    }
}


module.exports = { logAppointmentChange, logExpenseChange };
