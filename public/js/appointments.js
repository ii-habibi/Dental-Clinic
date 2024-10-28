
$(document).ready(function() {
    // Modal functionality
    const modal = $("#appointmentFormModal");
    const openModalBtn = $("#openAppointmentForm");
    const closeModalBtn = $(".close");

    openModalBtn.click(function() {
        modal.css("display", "block");
    });

    closeModalBtn.click(function() {
        modal.css("display", "none");
        location.reload();
    });

    $(window).click(function(event) {
        if (event.target == modal[0]) {
            modal.css("display", "none");
            location.reload();
        }
    });

    // Form submission
    $('#appointmentForm').on('submit', function(event) {
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
            success: function(response) {
                if (response.message === 'Appointment booked successfully') {
                    alert('Appointment booked successfully!');
                    $('#appointmentForm')[0].reset();
                } else {
                    alert(response.message);
                }
            },
            error: function(xhr) {
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
    $(document).on('click', '.delete-button', function() {
        const appointmentId = $(this).data('id');
        const row = $('#appointment-' + appointmentId);

        if (confirm('Are you sure you want to delete this appointment?')) {
            $.ajax({
                url: '/dashboard/appointments/delete/' + appointmentId,
                type: 'DELETE',
                success: function(response) {
                    row.fadeOut(300, function() {
                        $(this).remove();
                    });
                    alert('Appointment deleted successfully!');
                },
                error: function(xhr) {
                    alert('Error deleting appointment: ' + xhr.responseText);
                }
            });
        }
    });
});