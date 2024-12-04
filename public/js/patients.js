$(document).ready(function () {
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

    // Function to toggle appointment details
    function toggleDetails(id) {
        const $details = $('#' + id);
        $details.toggle();
    }

    // Function to open the edit modal and populate the form with existing patient data
    function openEditModal(button) {
        const patient = JSON.parse($(button).attr('data-patient'));
        $('#edit_patient_id').val(patient.patient_id);
        $('#edit_name').val(patient.name);
        $('#edit_age').val(patient.age);
        $('#edit_gender').val(patient.gender);
        $('#edit_email').val(patient.email);
        $('#edit_phone').val(patient.phone);
        $('#edit_address').val(patient.address);
        $('#editModal').show();
    }

    // Function to close the modal
    function closeModal() {
        $('#editModal').hide();
    }

    // AJAX form submission for updating patient data
    $('#editPatientForm').on('submit', function (event) {
        event.preventDefault();

        const patient_id = $('#edit_patient_id').val();
        const data = {
            name: $('#edit_name').val(),
            age: $('#edit_age').val(),
            gender: $('#edit_gender').val(),
            email: $('#edit_email').val(),
            phone: $('#edit_phone').val(),
            address: $('#edit_address').val()
        };

        $.ajax({
            url: `/dashboard/patients/${patient_id}`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                closeModal();
                alert('Patient updated successfully');
                location.reload(); // Reload to show updated data
            },
            error: function (xhr, status, error) {
                console.error("Error updating patient:", error);
                alert('Error updating patient');
            }
        });
    });

    // Event listeners for toggle and edit modal
    $(document).on('click', '[data-toggle="details"]', function () {
        const patientId = $(this).data('patient-id');
        toggleDetails('appointments-' + patientId);
    });

    $(document).on('click', '[data-toggle="edit"]', function () {
        openEditModal(this);
    });

    $(document).on('click', '[data-toggle="editClose"]', function() {
        closeModal();
    });

    // Handle delete button click
    $(document).on('click', '.delete-btn', function () {
        const patientId = $(this).data('patient-id');

        // Confirm if the user wants to delete both the patient and their appointments
        const confirmDelete = confirm("Are you sure you want to delete this patient? All associated appointments will be deleted as well.");

        if (confirmDelete) {
            // Make AJAX request to delete the patient and their appointments
            $.ajax({
                url: `/dashboard/patients/delete/${patientId}`,
                type: 'GET',
                success: function (response) {
                    if (response.success) {
                        // If successful, reload the page or update the UI
                        alert("Patient and associated appointments deleted successfully.");
                        location.reload(); // Reload the page to reflect the changes
                    } else {
                        alert("Error deleting patient and appointments.");
                    }
                },
                error: function (error) {
                    console.error("Error deleting patient and appointments:", error);
                    alert("Error deleting patient and appointments.");
                }
            });
        }
    });

    // Responsive behavior for sidebar
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });
});