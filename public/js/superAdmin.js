// public/js/superAdmin.js
$(document).ready(function() {
    let doctorMap = {};
    let patientMap = {};

    // Fetch all doctors once at page load
    function fetchAllDoctorsForMap() {
        $.ajax({
            url: '/dashboard/audit/doctors', 
            type: 'GET',
            success: function(data) {
                doctorMap = {};
                data.forEach(doc => {
                    doctorMap[doc.id] = doc.name;
                });
            },
            error: function() {
                console.error('Failed to fetch doctors for name map.');
            }
        });
    }

    // Fetch all patients
    function fetchAllPatientsForMap() {
        $.ajax({
            url: '/dashboard/audit/patients', 
            type: 'GET',
            success: function(data) {
                patientMap = {};
                data.forEach(patient => {
                    patientMap[patient.patient_id] = patient.name;
                });
            },
            error: function() {
                console.error('Failed to fetch patients for name map.');
            }
        });
    }

    fetchAllDoctorsForMap();
    fetchAllPatientsForMap();

    // Sidebar toggle
    $('#sidebar-toggle').click(function() {
        $('.sidebar').toggleClass('active');
    });

    $(document).click(function(event) {
        if (!$(event.target).closest('.sidebar, #sidebar-toggle').length) {
            $('.sidebar').removeClass('active');
        }
    });

    // Fetch all admins
    function fetchAdmins() {
        $.ajax({
            url: '/admins',
            type: 'GET',
            success: function(data) {
                $('#adminsList').empty();
                data.forEach(admin => {
                    $('#adminsList').append(`
                        <li>
                            ${admin.name} (${admin.username}) - Super Admin: ${admin.is_super_admin ? 'Yes' : 'No'}
                            <button class="deleteAdminBtn btn btn-danger" data-id="${admin.id}" data-is-super-admin="${admin.is_super_admin}">Delete</button>
                        </li>
                    `);
                });
            },
            error: function() {
                alert('Failed to fetch admins.');
            }
        });
    }
    fetchAdmins();

    // Add new admin
    $('#addAdminForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#newAdminName').val();
        const username = $('#newAdminUsername').val();
        const password = $('#newAdminPassword').val();
        const isSuperAdmin = $('#isSuperAdmin').val() === 'true';

        $.ajax({
            url: '/add-admin',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name, username, password, isSuperAdmin }),
            success: function(message) {
                alert(message);
                $('#newAdminName').val('');
                $('#newAdminUsername').val('');
                $('#newAdminPassword').val('');
                $('#isSuperAdmin').val('false');
                fetchAdmins();
            },
            error: function() {
                alert('Failed to add admin.');
            }
        });
    });

    // Delete admin
    $('#adminsList').on('click', '.deleteAdminBtn', function() {
        const adminId = $(this).data('id');
        const isSuperAdmin = $(this).data('is-super-admin');

        let password = null;
        if (isSuperAdmin) {
            password = prompt("Enter password to delete a Super Admin:");
            if (!password) return;
        }

        $.ajax({
            url: '/delete-admin',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ adminId, password }),
            success: function(message) {
                alert(message);
                fetchAdmins();
            },
            error: function() {
                alert('Failed to delete admin.');
            }
        });
    });

    // Update super admin credentials
    $('#updateSuperAdminForm').on('submit', function(e) {
        e.preventDefault();
        const currentPassword = $('#currentPassword').val();
        const username = $('#updateUsername').val();
        const newPassword = $('#updatePassword').val();

        $.ajax({
            url: '/update-super-admin',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ currentPassword, username, newPassword }),
            success: function(message) {
                alert(message);
                $('#currentPassword').val('');
                $('#updateUsername').val('');
                $('#updatePassword').val('');
            },
            error: function() {
                alert('Failed to update credentials.');
            }
        });
    });

    // Responsive sidebar
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });

    // Field labels for human-readable formatting
    const FIELD_LABELS = {
        'doctor_id': 'Doctor',
        'patient_id': 'Patient',
        'appointment_date': 'Appointment Date',
        'appointment_time': 'Appointment Time',
        'payment_date': 'Payment Date',
        'amount': 'Amount',
        'payment_message': 'Payment Message',
        'status': 'Status',
        'treatment_type': 'Treatment Type',
        'visit_type': 'Visit Type',
        'notes': 'Notes'
    };

    // Function to convert field names to human-readable labels
    function humanizeFieldName(field) {
        if (FIELD_LABELS[field]) return FIELD_LABELS[field];
        return field.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Function to format field values
    function formatValue(field, value) {
        if (!value) return value;

        // Convert doctor_id to doctor name
        if (field === 'doctor_id') {
            const docId = parseInt(value, 10);
            if (!isNaN(docId) && doctorMap[docId]) {
                return doctorMap[docId];
            }
        }

        // Convert patient_id to patient name
        if (field === 'patient_id') {
            const patId = parseInt(value, 10);
            if (!isNaN(patId) && patientMap[patId]) {
                return patientMap[patId];
            }
        }

        // Format dates
        if (field.endsWith('_date') || field.endsWith('_time')) {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
        }

        return value;
    }

    // Function to format changes between old and new values
    function formatChanges(oldValue, newValue, actionType) {
        // Remove JSON.parse since oldValue and newValue are already objects
        const oldObj = oldValue || {};
        const newObj = newValue || {};

        if (actionType === 'CREATE_EXPENSE' && newObj) {
            return Object.entries(newObj)
                .map(([k, v]) => `${humanizeFieldName(k)}: ${formatValue(k, v)}`)
                .join('<br>');
        }

        if (actionType === 'CREATE_APPOINTMENT' && newObj) {
            return Object.entries(newObj)
                .map(([k, v]) => `${humanizeFieldName(k)}: ${formatValue(k, v)}`)
                .join('<br>');
        }

        if (actionType === 'DELETE_APPOINTMENT' && oldObj) {
            return Object.entries(oldObj)
                .map(([k, v]) => `${humanizeFieldName(k)}: ${formatValue(k, v)}`)
                .join('<br>');
        }

        const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
        const changes = [];
        for (let key of allKeys) {
            const oldVal = oldObj[key];
            const newVal = newObj[key];
            if (oldVal !== newVal) {
                const displayOldVal = oldVal === undefined ? '(not set)' : formatValue(key, oldVal);
                const displayNewVal = newVal === undefined ? '(removed)' : formatValue(key, newVal);
                changes.push(`${humanizeFieldName(key)}: ${displayOldVal} => ${displayNewVal}`);
            }
        }

        if (changes.length === 0) {
            return 'No changes';
        }

        return changes.join('<br>');
    }

    // Function to generate a human-readable label for the record
    function getAppointmentOrExpenseLabel(log) {
        // If expense_id exists
        if (log.expense_id) {
            return `Expense ID: ${log.expense_id}`;
        }
        // If appointment_id exists
        if (log.appointment_id) {
            // Prefer newValue for the latest data, fallback to oldValue.
            const record = log.new_value || log.old_value;
            if (record) {
                const patientName = record.patient_id && patientMap[record.patient_id] ? patientMap[record.patient_id] : 'Unknown Patient';
                const treatmentType = record.treatment_type || 'Unknown Treatment';
                return `Appointment: ${patientName} - ${treatmentType}`;
            } else {
                return `Appointment ID: ${log.appointment_id}`;
            }
        }
        return 'N/A';
    }

    // Fetch and display audit logs
    $('#viewLogsBtn').on('click', function() {
        $.ajax({
            url: '/dashboard/audit', // Updated AJAX URL
            type: 'GET',
            success: function(data) {
                const logs = data.logs;
                const $table = $('#auditLogsTable');
                const $tbody = $table.find('tbody');
                $tbody.empty();

                if (logs.length === 0) {
                    $tbody.append('<tr><td colspan="7">No logs found.</td></tr>');
                } else {
                    logs.forEach(log => {
                        const changes = formatChanges(log.old_value, log.new_value, log.action_type);
                        const recordLabel = getAppointmentOrExpenseLabel(log);

                        $tbody.append(`
                            <tr>
                                <td>${log.id}</td>
                                <td>${log.admin_name}</td>
                                <td>${log.admin_username}</td>
                                <td>${recordLabel}</td>
                                <td>${log.action_type}</td>
                                <td>${changes}</td>
                                <td>${new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        `);
                    });
                }

                $table.show();
            },
            error: function() {
                alert('Failed to fetch audit logs.');
            }
        });
    });
});
