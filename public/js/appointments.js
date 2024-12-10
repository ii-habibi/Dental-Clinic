$(document).ready(function() {
    const modal = $("#appointmentFormModal");
    const editModal = $("#editAppointmentModal");
    const paymentModal = $("#paymentModal");
    const editPaymentModal = $("#editPaymentModal");

    const openModalBtn = $("#openAppointmentForm");
    const closeModalBtn = $(".close");

    openModalBtn.click(() => modal.css("display", "block"));

    closeModalBtn.click(function() {
        $(this).closest('.modal').css("display", "none");
        $('#appointmentForm')[0].reset();
        $('#editAppointmentForm')[0].reset();
        $('#paymentForm')[0].reset();
        $('#editPaymentForm')[0].reset();
    });

    $(window).click((event) => {
        if (event.target === modal[0] || event.target === editModal[0] || event.target === paymentModal[0] || event.target === editPaymentModal[0]) {
            modal.css("display", "none");
            editModal.css("display", "none");
            paymentModal.css("display", "none");
            editPaymentModal.css("display", "none");
            $('#appointmentForm')[0].reset();
            $('#editAppointmentForm')[0].reset();
            $('#paymentForm')[0].reset();
            $('#editPaymentForm')[0].reset();
        }
    });

    // Booking a new appointment
    $('#appointmentForm').on('submit', function(event) {
        event.preventDefault();
        const data = formDataToJson($(this).serializeArray());
        $.ajax({
            url: '/dashboard/appointments',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert('Appointment booked successfully!');
                modal.css("display", "none");
                $('#appointmentForm')[0].reset();
                location.reload();
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message ? response.message : 'An error occurred while booking the appointment.');
            }
        });
    });

    // Initial binding for appointment items
    $('.appointment-item').on('click', function() {
        const appointmentId = $(this).data('id');
        $('.appointment-item').removeClass('active');
        $(this).addClass('active');
        loadAppointmentDetails(appointmentId);
    });

    // AJAX search with debounce
    let searchTimeout;
    $('#searchInput').on('keyup', function() {
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    function performSearch(query) {
        $.ajax({
            url: '/dashboard/appointments/search',
            method: 'GET',
            data: { search: query },
            success: function(response) {
                const appointments = response.appointments;
                const $container = $('#appointmentItems');
                $container.empty();

                if (appointments.length === 0) {
                    $container.append('<p>No appointments found.</p>');
                    return;
                }

                appointments.forEach(app => {
                    const dateFormatted = new Date(app.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const itemHtml = `
                        <div class="appointment-item" data-id="${app.appointment_id}">
                            <div class="appointment-summary">
                                <h3>${app.name}</h3>
                                <p>${app.treatment_type || ''}</p>
                                <span class="appointment-date">${dateFormatted}</span>
                                <span class="appointment-status status-${app.status.toLowerCase()}">${app.status}</span>
                            </div>
                        </div>
                    `;
                    $container.append(itemHtml);
                });

                // Re-bind click event
                $('.appointment-item').off('click').on('click', function() {
                    const appointmentId = $(this).data('id');
                    $('.appointment-item').removeClass('active');
                    $(this).addClass('active');
                    loadAppointmentDetails(appointmentId);
                });
            },
            error: function() {
                alert('Error searching appointments.');
            }
        });
    }

    function loadAppointmentDetails(appointmentId) {
        $.ajax({
            url: `/dashboard/appointments/${appointmentId}`,
            type: 'GET',
            success: (appointmentData) => {
                const appointment = appointmentData.appointment;
                let paymentInfoHtml = `
                    <h3>Payment Information</h3>
                    <div class="info-group"><label>Status:</label><span>${appointment.payment_status || 'N/A'}</span></div>
                    <div class="info-group"><label>Amount:</label><span>${appointment.amount !== null ? appointment.amount : 'N/A'}</span></div>
                    <div class="info-group"><label>Date:</label><span>${appointment.payment_date ? new Date(appointment.payment_date).toLocaleDateString('en-US') : 'N/A'}</span></div>
                    <div class="info-group"><label>Message:</label><p>${appointment.payment_message || 'N/A'}</p></div>
                `;

                const detailsHtml = `
                    <h2>Appointment Details</h2>
                    <div class="appointment-info">
                        <div class="patient-info">
                            <h3>Patient Information</h3>
                            <div class="info-group"><label>Name:</label><span>${appointment.patient_name}</span></div>
                            <div class="info-group"><label>Gender:</label><span>${appointment.gender}</span></div>
                            <div class="info-group"><label>Age:</label><span>${appointment.age}</span></div>
                            <div class="info-group"><label>Email:</label><span>${appointment.email}</span></div>
                            <div class="info-group"><label>Phone:</label><span>${appointment.phone}</span></div>
                        </div>
                        <div class="appointment-details">
                            <h3>Appointment Information</h3>
                            <div class="info-group"><label>Doctor:</label><span>${appointment.doctor_name}</span></div>
                            <div class="info-group"><label>Date:</label><span>${new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                            <div class="info-group"><label>Time:</label><span>${appointment.appointment_time || 'N/A'}</span></div>
                            <div class="info-group"><label>Visit Type:</label><span>${appointment.visit_type}</span></div>
                            <div class="info-group"><label>Status:</label><span class="appointment-status status-${appointment.status.toLowerCase()}">${appointment.status}</span></div>
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
                    <div class="payment-section">
                        ${paymentInfoHtml}
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
        } else if (appointment.status === 'Completed') {
            // Edit Payment option for completed appointments
            buttons += `
                <button class="btn btn-edit-payment" data-id="${appointment.appointment_id}">Edit Payment</button>
            `;
        }

        buttons += `
            <button class="btn btn-edit" data-id="${appointment.appointment_id}">Edit</button>
            <button class="btn btn-delete" data-id="${appointment.appointment_id}">Delete</button>
        `;
        return buttons;
    }

    // Event delegation for actions
    $(document).on('click', '.btn-approve, .btn-reject, .btn-complete, .btn-edit, .btn-delete, .btn-edit-payment', function() {
        const $button = $(this);
        const appointmentId = $button.data('id');
        const status = $button.data('status');

        if ($button.hasClass('btn-delete')) {
            handleDelete(appointmentId);
        } else if ($button.hasClass('btn-edit')) {
            handleEdit(appointmentId);
        } else if ($button.hasClass('btn-complete')) {
            // Show payment modal before completing
            $('#payment_appointment_id').val(appointmentId);
            const today = new Date().toISOString().split('T')[0];
            $('#payment_date').val(today);
            paymentModal.css("display", "block");
        } else if ($button.hasClass('btn-edit-payment')) {
            handleEditPayment(appointmentId);
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
        $('#edit-status').val(appointment.status);
    }

    $('#editAppointmentForm').on('submit', function(event) {
        event.preventDefault();
        const data = formDataToJson($(this).serializeArray());

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
                alert(response && response.message ? response.message : 'An error occurred while updating the appointment.');
            }
        });
    });

    // Payment form submission (Completing Appointment)
    $('#paymentForm').on('submit', function(event) {
        event.preventDefault();
        const appointmentId = $('#payment_appointment_id').val();
        const amount = $('#payment_amount').val();
        const payment_status = $('#payment_status').val();
        const payment_date = $('#payment_date').val();
        const payment_message = $('#payment_message').val();

        const data = {
            status: 'Completed',
            amount: amount,
            payment_status: payment_status,
            payment_date: payment_date,
            payment_message: payment_message
        };

        $.ajax({
            url: `/dashboard/appointments/status/${appointmentId}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert(response.message);
                paymentModal.css("display", "none");
                $('#paymentForm')[0].reset();
                updateAppointmentItem(appointmentId, 'Completed');
                loadAppointmentDetails(appointmentId);
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message ? response.message : 'An error occurred while completing the appointment.');
            }
        });
    });

    function handleEditPayment(appointmentId) {
        // Fetch current payment details and populate edit payment form
        $.ajax({
            url: `/dashboard/appointments/${appointmentId}`,
            type: 'GET',
            success: (appointmentData) => {
                const appointment = appointmentData.appointment;
                if (appointment.status !== 'Completed') {
                    alert('Payment can only be edited for completed appointments.');
                    return;
                }
                populateEditPaymentForm(appointment);
                editPaymentModal.css("display", "block");
            },
            error: (xhr) => {
                alert('Error fetching appointment details.');
            }
        });
    }

    function populateEditPaymentForm(appointment) {
        $('#edit_payment_appointment_id').val(appointment.appointment_id);
        $('#edit_payment_amount').val(appointment.amount || '');
        $('#edit_payment_status').val(appointment.payment_status || 'Paid');

        const date = appointment.payment_date ? appointment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0];
        $('#edit_payment_date').val(date);
        $('#edit_payment_message').val(appointment.payment_message || '');
    }

    // Edit Payment form submission
    $('#editPaymentForm').on('submit', function(event) {
        event.preventDefault();
        const appointmentId = $('#edit_payment_appointment_id').val();
        const amount = $('#edit_payment_amount').val();
        const payment_status = $('#edit_payment_status').val();
        const payment_date = $('#edit_payment_date').val();
        const payment_message = $('#edit_payment_message').val();

        const data = {
            amount: amount,
            payment_status: payment_status,
            payment_date: payment_date,
            payment_message: payment_message
        };

        $.ajax({
            url: `/dashboard/appointments/${appointmentId}/payment`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert(response.message);
                editPaymentModal.css("display", "none");
                $('#editPaymentForm')[0].reset();
                loadAppointmentDetails(appointmentId);
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message ? response.message : 'An error occurred while updating the payment.');
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

    function formDataToJson(formData) {
        const data = {};
        formData.forEach(item => (data[item.name] = item.value));
        return data;
    }
});
