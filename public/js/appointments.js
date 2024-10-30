
$(document).ready(function () {
    // Modal functionality
    const modal = $("#appointmentFormModal");
    const openModalBtn = $("#openAppointmentForm");
    const closeModalBtn = $(".close");

    openModalBtn.click(function () {
        modal.css("display", "block");
    });

    closeModalBtn.click(function () {
        modal.css("display", "none");
        location.reload();
    });

    $(window).click(function (event) {
        if (event.target == modal[0]) {
            modal.css("display", "none");
            location.reload();
        }
    });

    // Form submission
    $('#appointmentForm').on('submit', function (event) {
        event.preventDefault();

        const formData = $(this).serializeArray();
        const data = {};
        formData.forEach(item => {
            data[item.name] = item.value;
        });

        $.ajax({
            url: '/dashboard/appointments/book',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                if (response.message === 'Appointment booked successfully') {
                    alert('Appointment booked successfully!');
                    $('#appointmentForm')[0].reset();
                } else {
                    alert(response.message);
                }
            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                if (response && response.message) {
                    alert(response.message); // Show the server error message
                } else {
                    alert('An error occurred while booking the appointment.');
                }
                console.error('Error booking appointment:', xhr.status, xhr.statusText);
            }
        });
    });


    // Delete appointment functionality
    $(document).on('click', '.delete-button', function () {
        const appointmentId = $(this).data('id');
        const row = $('#appointment-' + appointmentId);
        console.log(appointmentId)

        if (confirm('Are you sure you want to delete this appointment?')) {
            $.ajax({
                url: '/dashboard/appointments/delete/' + appointmentId,
                type: 'DELETE',
                success: function (response) {
                    row.fadeOut(300, function () {
                        $(this).remove();
                    });
                    alert('Appointment deleted successfully!');
                },
                error: function (xhr) {
                    alert('Error deleting appointment: ' + xhr.responseText);
                }
            });
        }
    });





    // Handle approve and reject button clicks
    $('.btn-approve, .btn-reject').on('click', function () {
        const $button = $(this);
        const appointmentId = $button.data('id');
        const status = $button.data('status');

        const confirmMessage = `Are you sure you want to ${status === 'Approved' ? 'approve' : 'reject'} this appointment?`;
       

        if (confirm(confirmMessage)) {
            $.ajax({
                url: `/dashboard/appointments/status/${appointmentId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status }),
                success: (data) => {
                    // Update status in the table
                    $(`#appointment-${appointmentId} td:nth-child(11)`).text(status);
                    alert(data.message);

                    // Remove approve and reject buttons
                    $(`#appointment-${appointmentId} .btn-approve, #appointment-${appointmentId} .btn-reject`).remove();
                },
                error: (xhr) => {
                    const response = xhr.responseJSON;
                    console.error('Error response:', xhr.responseText);
                    alert(response ? response.message : 'An error occurred while updating the status.');
                }
            });
        }
    });
});


