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

    // Delete blog functionality
    $('.delete-button').click(function() {
        const blogId = $(this).data('id');
        const row = $('#blog-' + blogId);

        if (confirm('Are you sure you want to delete this blog?')) {
            $.ajax({
                url: '/dashboard/blogs/delete/' + blogId,
                type: 'POST',
                success: function(response) {
                    row.fadeOut(300, function() {
                        $(this).remove();
                    });
                    alert('Blog deleted successfully!');
                },
                error: function(xhr) {
                    alert('An error occurred while deleting the blog. Please try again.');
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