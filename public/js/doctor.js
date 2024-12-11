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

    // Handle doctor deletion
    $('.btn-delete').click(function() {
        const doctorId = $(this).data('doctor-id');
        if (confirm('Are you sure you want to delete this doctor?')) {
            $.ajax({
                url: `/dashboard/doctor/delete/${doctorId}`,
                type: 'POST',
                success: function(result) {
                    alert('Doctor deleted successfully');
                    location.reload();
                },
                error: function(err) {
                    console.error('Error deleting doctor:', err);
                    alert('Error deleting doctor');
                }
            });
        }
    });

    // Handle doctor edit form submission
    $('#editDoctorForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(result) {
                alert('Doctor updated successfully');
                window.location.href = '/dashboard/doctor';
            },
            error: function(err) {
                console.error('Error updating doctor:', err);
                alert('Error updating doctor');
            }
        });
    });

    // Handle doctor add form submission
    $('#addDoctorForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(result) {
                alert('Doctor added successfully');
                window.location.href = '/dashboard/doctor';
            },
            error: function(err) {
                console.error('Error adding doctor:', err);
                alert('Error adding doctor');
            }
        });
    });

    // Responsive behavior for sidebar
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });
});