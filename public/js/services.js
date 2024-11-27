$(document).ready(function() {
    // Show Add Service Form
    $('#showAddServiceForm').click(function() {
        $('#addServiceSection').slideDown();
        $(this).hide();
    });

    // Cancel Add Service
    $('#cancelAddService').click(function() {
        $('#addServiceSection').slideUp();
        $('#showAddServiceForm').show();
        $('#addServiceForm')[0].reset();
    });

    // Add Service
    $('#addServiceForm').on('submit', function(event) {
        event.preventDefault();

        const serviceData = {
            name: $('#name').val(),
            description: $('#description').val(),
            price: $('#price').val()
        };

        $.ajax({
            url: '/dashboard/services/add',
            type: 'POST',
            data: serviceData,
            success: function(response) {
                showNotification('Service added successfully', 'success');
                $('#addServiceForm')[0].reset();
                $('#addServiceSection').slideUp();
                $('#showAddServiceForm').show();
                addServiceToTable(response.service);
            },
            error: function(xhr) {
                showNotification('Error adding service: ' + xhr.responseText, 'error');
            }
        });
    });

    // Show Edit Service Form
    $(document).on('click', '.edit-button', function() {
        const serviceId = $(this).data('id');
        const row = $('#service-' + serviceId);
        const name = row.find('td:eq(0)').text();
        const description = row.find('td:eq(1)').text();
        const price = row.find('td:eq(2)').text().replace('$', '');

        $('#editServiceId').val(serviceId);
        $('#editServiceName').val(name);
        $('#editServiceDescription').val(description);
        $('#editServicePrice').val(price);

        $('#editServiceSection').slideDown();
        $('html, body').animate({
            scrollTop: $('#editServiceSection').offset().top
        }, 500);
    });

    // Cancel Edit Service
    $('#cancelEditService').click(function() {
        $('#editServiceSection').slideUp();
        $('#editServiceForm')[0].reset();
    });

    // Edit Service
    $('#editServiceForm').on('submit', function(event) {
        event.preventDefault();

        const serviceId = $('#editServiceId').val();
        const serviceData = {
            name: $('#editServiceName').val(),
            description: $('#editServiceDescription').val(),
            price: $('#editServicePrice').val()
        };

        $.ajax({
            url: '/dashboard/services/edit/' + serviceId,
            type: 'PUT',
            data: serviceData,
            success: function(response) {
                showNotification('Service updated successfully', 'success');
                $('#editServiceSection').slideUp();
                updateServiceInTable(serviceId, serviceData);
            },
            error: function(xhr) {
                showNotification('Error updating service: ' + xhr.responseText, 'error');
            }
        });
    });

    // Delete Service
    $(document).on('click', '.delete-button', function() {
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

    // Helper function to show notifications
    function showNotification(message, type) {
        const notificationElement = $('<div>')
            .addClass('notification')
            .addClass(type)
            .text(message)
            .appendTo('body');

        setTimeout(function() {
            notificationElement.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }

    // Helper function to add a new service to the table
    function addServiceToTable(service) {
        const newRow = `
            <tr id="service-${service.service_id}">
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>$${parseFloat(service.price).toFixed(2)}</td>
                <td>
                    <button class="btn btn-edit edit-button" data-id="${service.service_id}">Edit</button>
                    <button class="btn btn-delete delete-button" data-id="${service.service_id}">Delete</button>
                </td>
            </tr>
        `;
        $('#service-list tbody').append(newRow);
    }

    // Helper function to update a service in the table
    function updateServiceInTable(serviceId, serviceData) {
        const row = $('#service-' + serviceId);
        row.find('td:eq(0)').text(serviceData.name);
        row.find('td:eq(1)').text(serviceData.description);
        row.find('td:eq(2)').text('$' + parseFloat(serviceData.price).toFixed(2));
    }


    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
});
