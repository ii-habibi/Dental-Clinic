$(document).ready(function() {
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

    // Delete service functionality
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
                    showNotification('Service deleted successfully!', 'success');
                },
                error: function(xhr) {
                    showNotification('An error occurred while deleting the service. Please try again.', 'error');
                }
            });
        }
    });

    // Add service functionality
    $('#addServiceForm').on('submit', function(event) {
        event.preventDefault();

        const serviceData = {
            name: $('#name').val(),
            description: $('#description').val(),
            price: $('#price').val()
        };

        $.ajax({
            url: '/dashboard/services',
            type: 'POST',
            data: serviceData,
            success: function(response) {
                showNotification('Service added successfully', 'success');
                window.location.href = '/dashboard/services';
            },
            error: function(xhr) {
                showNotification('Error adding service: ' + xhr.responseText, 'error');
            }
        });
    });

    // Edit service functionality
    $('#editServiceForm').on('submit', function(event) {
        event.preventDefault();

        const serviceId = $('#serviceId').val();
        const serviceData = {
            name: $('#serviceName').val(),
            description: $('#serviceDescription').val(),
            price: $('#servicePrice').val()
        };

        if (!serviceId) {
            showNotification("Service ID not found", 'error');
            return;
        }

        $.ajax({
            url: '/dashboard/services/edit/' + serviceId,
            type: 'POST',
            data: serviceData,
            success: function(response) {
                showNotification('Service updated successfully', 'success');
                window.location.href = '/dashboard/services';
            },
            error: function(xhr) {
                showNotification('Error updating service: ' + xhr.responseText, 'error');
            }
        });
    });

    // Responsive behavior for sidebar
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });

    // Function to show notifications
    function showNotification(message, type) {
        const notificationElement = $('<div>').addClass('notification').addClass(type).text(message);
        $('body').append(notificationElement);
        notificationElement.fadeIn().delay(3000).fadeOut(function() {
            $(this).remove();
        });
    }
});