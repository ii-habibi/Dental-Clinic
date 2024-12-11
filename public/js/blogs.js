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

    // Add blog functionality
    $('#addBlogForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        $.ajax({
            url: '/dashboard/blogs/add',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                showNotification('Blog added successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard/blogs';
                }, 2000);
            },
            error: function(xhr) {
                showNotification('An error occurred while adding the blog. Please try again.', 'error');
            }
        });
    });

    // Edit blog functionality
    $('#editBlogForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const blogId = formData.get('blogId');

        $.ajax({
            url: '/dashboard/blogs/edit/' + blogId,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                showNotification('Blog updated successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard/blogs';
                }, 2000);
            },
            error: function(xhr) {
                showNotification('An error occurred while updating the blog. Please try again.', 'error');
            }
        });
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
                    showNotification('Blog deleted successfully!', 'success');
                },
                error: function(xhr) {
                    showNotification('An error occurred while deleting the blog. Please try again.', 'error');
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

    // Function to show notifications
    function showNotification(message, type) {
        const notification = $('#notification');
        notification.text(message).addClass(type).fadeIn();
        setTimeout(() => {
            notification.fadeOut(() => {
                notification.removeClass(type);
            });
        }, 3000);
    }
});