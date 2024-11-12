$(document).ready(function() {
    $('.delete-button').click(function() {
        const serviceId = $(this).data('id');
        const row = $('#service-' + serviceId);

        if (confirm('Are you sure you want to delete this service?')) {
            $.ajax({
                url: '/dashboard/services/' + serviceId,
                type: 'DELETE',
                success: function(response) {
                    row.fadeOut(300, function() {
                        $(this).remove();
                    });
                    alert('Service deleted successfully!');
                },
                error: function(xhr) {
                    alert('An error occurred while deleting the service. Please try again.');
                }
            });
        }
    });

    $('#editServiceForm').on('submit', function(event) {
        event.preventDefault();

        const serviceId = $('#serviceId').val();
        const serviceData = {
            name: $('#serviceName').val(),
            description: $('#serviceDescription').val(),
            price: $('#servicePrice').val()
        };

        if (!serviceId) {
            alert("Service ID not found");
            return;
        }

        $.ajax({
            url: '/dashboard/services/edit/' + serviceId,
            type: 'POST',
            data: serviceData,
            success: function(response) {
                alert('Service updated successfully');
                window.location.href = '/dashboard/services';
            },
            error: function(xhr) {
                alert('Error updating service: ' + xhr.responseText);
            }
        });
    });
});