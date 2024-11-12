$(document).ready(function() {
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
});