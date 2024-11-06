$(document).ready(function() {
    const modal = $("#appointmentFormModal");
    const editModal = $("#editAppointmentModal");
    const openModalBtn = $("#openAppointmentForm");
    const closeModalBtn = $(".close");

    openModalBtn.click(() => modal.css("display", "block"));

    closeModalBtn.click(function() {
        $(this).closest('.modal').css("display", "none");
        $('#appointmentForm')[0].reset();
        $('#editAppointmentForm')[0].reset();
    });

    $(window).click((event) => {
        if (event.target === modal[0] || event.target === editModal[0]) {
            modal.css("display", "none");
            editModal.css("display", "none");
            $('#appointmentForm')[0].reset();
            $('#editAppointmentForm')[0].reset();
        }
    });

    // Form submission handling
    $('#appointmentForm').on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serializeArray();
        const data = {};
        formData.forEach(item => (data[item.name] = item.value));

        $.ajax({
            url: '/dashboard/appointments',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert('Appointment booked successfully!');
                modal.css("display", "none");
                $('#appointmentForm')[0].reset();
                location.reload(); // Reload to show the new appointment
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message
                    ? response.message
                    : 'An error occurred while booking the appointment.'
                );
            }
        });
    });

    // Appointment item click handler
    $('.appointment-item').click(function() {
        const appointmentId = $(this).data('id');
        $('.appointment-item').removeClass('active');
        $(this).addClass('active');
        loadAppointmentDetails(appointmentId);
    });

    function loadAppointmentDetails(appointmentId) {
        $.ajax({
            url: `/dashboard/appointments/${appointmentId}`,
            type: 'GET',
            success: (appointmentData) => {
                const appointment = appointmentData.appointment;
                const detailsHtml = `
                    <h2>Appointment Details</h2>
                    <div class="appointment-info">
                        <div class="patient-info">
                            <h3>Patient Information</h3>
                            <div class="info-group">
                                <label>Name:</label>
                                <span>${appointment.patient_name}</span>
                            </div>
                            <div class="info-group">
                                <label>Gender:</label>
                                <span>${appointment.gender}</span>
                            </div>
                            <div class="info-group">
                                <label>Age:</label>
                                <span>${appointment.age}</span>
                            </div>
                            <div class="info-group">
                                <label>Email:</label>
                                <span>${appointment.email}</span>
                            </div>
                            <div class="info-group">
                                <label>Phone:</label>
                                <span>${appointment.phone}</span>
                            </div>
                        </div>
                        <div class="appointment-details">
                            <h3>Appointment Information</h3>
                            <div class="info-group">
                                <label>Doctor:</label>
                                <span>${appointment.doctor_name}</span>
                            </div>
                            <div class="info-group">
                                <label>Date:</label>
                                <span>${new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div class="info-group">
                                <label>Time:</label>
                                <span>${appointment.appointment_time || 'N/A'}</span>
                            </div>
                            <div class="info-group">
                                <label>Visit Type:</label>
                                <span>${appointment.visit_type}</span>
                            </div>
                            <div class="info-group">
                                <label>Status:</label>
                            <span class="appointment-status status-${appointment.status.toLowerCase()}">${appointment.status}</span>

                            </div>
                        </div>
                    </div>
                    <div class="treatment-notes">
                        <div class="info-group treatment-type">
                            <label>Treatment:</label>
                            <p>${appointment.treatment_type}</p>
                        </div>
                        <div class="info-group notes">
                            <label>Notes:</label>
                            <p>${appointment.notes || 'No notes'}</p>
                        </div>
                    </div>
                    <div class="appointment-actions">
                        ${getActionButtons(appointment)}
                    </div>
                `;
                $('#appointmentDetailsContent').html(detailsHtml);
            },
            error: (xhr) => {
                console.error('Error fetching appointment details:', xhr.status, xhr.statusText);
            }
        });
    }

    function getActionButtons(appointment) {
        let buttons = '';
        if (appointment.status === 'Pending') {
            buttons += `
                <button class="btn btn-approve" data-id="${appointment.appointment_id}" data-status="Approved">Approve</button>
                <button class="btn btn-reject" data-id="${appointment.appointment_id}" data-status="Rejected">Reject</button>
            `;
        } else if (appointment.status === 'Approved') {
            buttons += `
                <button class="btn btn-complete" data-id="${appointment.appointment_id}" data-status="Completed">Mark as Completed</button>
            `;
        }
        buttons += `
            <button class="btn btn-edit" data-id="${appointment.appointment_id}">Edit</button>
            <button class="btn btn-delete" data-id="${appointment.appointment_id}">Delete</button>
        `;
        return buttons;
    }

    // Event delegation for approve, reject, complete, edit, and delete actions
    $(document).on('click', '.btn-approve, .btn-reject, .btn-complete, .btn-edit, .btn-delete', function() {
        const $button = $(this);
        const appointmentId = $button.data('id');
        const status = $button.data('status');

        if ($button.hasClass('btn-delete')) {
            handleDelete(appointmentId);
        } else if ($button.hasClass('btn-edit')) {
            handleEdit(appointmentId);
        } else {
            handleStatusChange(appointmentId, status);
        }
    });

    function handleDelete(appointmentId) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            $.ajax({
                url: `/dashboard/appointments/delete/${appointmentId}`,
                type: 'DELETE',
                success: (data) => {
                    $(`[data-id="${appointmentId}"]`).remove();
                    $('#appointmentDetailsContent').empty();
                    alert(data.message);
                },
                error: (xhr) => {
                    const response = xhr.responseJSON;
                    alert(response ? response.message : 'An error occurred while deleting the appointment.');
                }
            });
        }
    }

    function handleStatusChange(appointmentId, status) {
        const confirmMessage = `Are you sure you want to mark this appointment as ${status}?`;

        if (confirm(confirmMessage)) {
            $.ajax({
                url: `/dashboard/appointments/status/${appointmentId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status }),
                success: (data) => {
                    updateAppointmentItem(appointmentId, status);
                    loadAppointmentDetails(appointmentId);
                    alert(data.message);
                },
                error: (xhr) => {
                    const response = xhr.responseJSON;
                    alert(response ? response.message : 'An error occurred while updating the status.');
                }
            });
        }
    }

    function handleEdit(appointmentId) {
        $.ajax({
            url: `/dashboard/appointments/${appointmentId}`,
            type: 'GET',
            success: (appointmentData) => {
                const appointment = appointmentData.appointment;
                populateEditForm(appointment);
                editModal.css("display", "block");
            },
            error: (xhr) => {
                console.error('Error fetching appointment details:', xhr.status, xhr.statusText);
            }
        });
    }

    function populateEditForm(appointment) {
        $('#edit-appointment-id').val(appointment.appointment_id);
        $('#edit-name').val(appointment.patient_name);
        $('#edit-gender').val(appointment.gender);
        $('#edit-age').val(appointment.age);
        $('#edit-email').val(appointment.email);
        $('#edit-phone').val(appointment.phone);
        $('#edit-doctor').val(appointment.doctor_id);
        $('#edit-date').val(appointment.appointment_date.split('T')[0]);
        $('#edit-time').val(appointment.appointment_time);
        
        $('#edit-treatment').val(appointment.treatment_type);
        $('#edit-visitType').val(appointment.visit_type);
        $('#edit-notes').val(appointment.notes);
        $('#edit-status').val(appointment.status);  // Ensure this input exists in the form

    }

    $('#editAppointmentForm').on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serializeArray();
        const data = {};
        formData.forEach(item => (data[item.name] = item.value));

        $.ajax({
            url: `/dashboard/appointments/${data.appointment_id}`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert('Appointment updated successfully!');
                editModal.css("display", "none");
                $('#editAppointmentForm')[0].reset();
                loadAppointmentDetails(data.appointment_id);
                updateAppointmentItem(data.appointment_id, data.status);
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message
                    ? response.message
                    : 'An error occurred while updating the appointment.'
                );
            }
        });
    });

    function updateAppointmentItem(appointmentId, status) {
        const $appointmentItem = $(`.appointment-item[data-id="${appointmentId}"]`);
        $appointmentItem.find('.appointment-status')
            .removeClass('status-pending status-approved status-rejected status-completed')
            .addClass(`status-${status.toLowerCase()}`)
            .text(status);
    }
    
});