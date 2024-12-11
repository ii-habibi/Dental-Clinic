$(document).ready(function() {
    let doctorMap = {};
    let patientMap = {};

    // Fetch all doctors once at page load
    function fetchAllDoctorsForMap() {
        $.ajax({
            url: '/dashboard/audit/doctors',
            type: 'GET',
            success: function(data) {
                doctorMap = Object.fromEntries(data.map(doc => [doc.id, doc.name]));
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch doctors for name map:', error);
                showNotification('Failed to fetch doctors. Please try again.', 'error');
            }
        });
    }

    // Fetch all patients
    function fetchAllPatientsForMap() {
        $.ajax({
            url: '/dashboard/audit/patients',
            type: 'GET',
            success: function(data) {
                patientMap = Object.fromEntries(data.map(patient => [patient.patient_id, patient.name]));
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch patients for name map:', error);
                showNotification('Failed to fetch patients. Please try again.', 'error');
            }
        });
    }

    fetchAllDoctorsForMap();
    fetchAllPatientsForMap();

    // Sidebar toggle functionality
    $('#sidebar-toggle').click(function() {
        $('.sidebar').toggleClass('active');
    });

    // Close sidebar when clicking outside of it
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
                const $adminsList = $('#adminsList');
                $adminsList.empty();
                data.forEach(admin => {
                    $adminsList.append(`
                        <li>
                            ${escapeHtml(admin.name)} (${escapeHtml(admin.username)}) - Super Admin: ${admin.is_super_admin ? 'Yes' : 'No'}
                            <button class="deleteAdminBtn btn btn-danger" data-id="${admin.id}" data-is-super-admin="${admin.is_super_admin}">Delete</button>
                        </li>
                    `);
                });
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch admins:', error);
                showNotification('Failed to fetch admins. Please try again.', 'error');
            }
        });
    }
    fetchAdmins();

    // Add new admin
    $('#addAdminForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#newAdminName').val().trim();
        const username = $('#newAdminUsername').val().trim();
        const password = $('#newAdminPassword').val();
        const isSuperAdmin = $('#isSuperAdmin').val() === 'true';

        if (!name || !username || !password) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        $.ajax({
            url: '/add-admin',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name, username, password, isSuperAdmin }),
            success: function(message) {
                showNotification(message, 'success');
                $('#addAdminForm')[0].reset();
                fetchAdmins();
            },
            error: function(xhr, status, error) {
                console.error('Failed to add admin:', error);
                showNotification('Failed to add admin. Please try again.', 'error');
            }
        });
    });

    // Delete admin
    $('#adminsList').on('click', '.deleteAdminBtn', function() {
        const adminId = $(this).data('id');
        const isSuperAdmin = $(this).data('is-super-admin');

        let password = null;
        if (isSuperAdmin) {
            password = prompt("Enter your password to delete a Super Admin:");
            if (!password) return;
        }

        if (confirm('Are you sure you want to delete this admin?')) {
            $.ajax({
                url: '/delete-admin',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ adminId, password }),
                success: function(message) {
                    showNotification(message, 'success');
                    fetchAdmins();
                },
                error: function(xhr, status, error) {
                    console.error('Failed to delete admin:', error);
                    showNotification('Failed to delete admin. Please try again.', 'error');
                }
            });
        }
    });

    // Update super admin credentials
    $('#updateSuperAdminForm').on('submit', function(e) {
        e.preventDefault();
        const currentPassword = $('#currentPassword').val();
        const username = $('#updateUsername').val().trim();
        const newPassword = $('#updatePassword').val();

        if (!currentPassword || !username || !newPassword) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        $.ajax({
            url: '/update-super-admin',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ currentPassword, username, newPassword }),
            success: function(message) {
                showNotification(message, 'success');
                $('#updateSuperAdminForm')[0].reset();
            },
            error: function(xhr, status, error) {
                console.error('Failed to update credentials:', error);
                showNotification('Failed to update credentials. Please try again.', 'error');
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
        return FIELD_LABELS[field] || field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Function to format field values
    function formatValue(field, value) {
        if (!value) return value;

        if (field === 'doctor_id') {
            return doctorMap[value] || value;
        }

        if (field === 'patient_id') {
            return patientMap[value] || value;
        }

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
        const oldObj = oldValue || {};
        const newObj = newValue || {};

        if (actionType === 'CREATE_EXPENSE' || actionType === 'CREATE_APPOINTMENT') {
            return Object.entries(newObj)
                .map(([k, v]) => `${humanizeFieldName(k)}: ${formatValue(k, v)}`)
                .join('<br>');
        }

        if (actionType === 'DELETE_APPOINTMENT') {
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

        return changes.length === 0 ? 'No changes' : changes.join('<br>');
    }

    // Function to generate a human-readable label for the record
    function getAppointmentOrExpenseLabel(log) {
        if (log.expense_id) {
            return `Expense ID: ${log.expense_id}`;
        }
        if (log.appointment_id) {
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
            url: '/dashboard/audit',
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
                                <td>${escapeHtml(log.admin_name)}</td>
                                <td>${escapeHtml(log.admin_username)}</td>
                                <td>${escapeHtml(recordLabel)}</td>
                                <td>${escapeHtml(log.action_type)}</td>
                                <td>${changes}</td>
                                <td>${new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        `);
                    });
                }

                $table.show();
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch audit logs:', error);
                showNotification('Failed to fetch audit logs. Please try again.', 'error');
            }
        });
    });

    // Function to show notifications
    function showNotification(message, type) {
        const notificationElement = $('<div>').addClass('notification').addClass(type).text(message);
        $('body').append(notificationElement);
        notificationElement.fadeIn().delay(3000).fadeOut(function() {
            $(this).remove();
        });
    }

    // Function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});