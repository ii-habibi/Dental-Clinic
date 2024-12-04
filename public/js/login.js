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
                  $('#message').html('<p class="success">Login successful. Redirecting to dashboard...</p>');
                  setTimeout(function() {
                      window.location.href = '/dashboard'; // Redirect to dashboard
                  }, 1500);
              } else {
                  // Login failed
                  $('#message').html('<p class="error">' + response.message + '</p>');
              }
          },
          error: function() {
              $('#message').html('<p class="error">An error occurred. Please try again.</p>');
          }
      });
  });
});

