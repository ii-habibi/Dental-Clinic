// public/js/login.js

$(document).ready(function() {
    $('#loginForm').submit(function(event) {
      event.preventDefault(); // Prevent default form submission
  
      const formData = $(this).serialize(); // Serialize form data
  
      $.ajax({
        url: '/login', // Replace with your login endpoint
        type: 'POST',
        data: formData,
        success: function(response) {
          if (response.success) {
            // Successful login
            window.location.href = '/dashboard'; // Redirect to dashboard
          } else {
            // Login failed
            $('#message').html('<p style="color: red;">' + response.message + '</p>');
          }
        },
        error: function() {
          $('#message').html('<p style="color: red;">An error occurred. Please try again.</p>');
        }
      });
    });
  });
  