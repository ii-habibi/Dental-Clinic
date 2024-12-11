$(document).ready(function() {
    const loginForm = $('#loginForm');
    const messageDiv = $('#message');
    const togglePasswordBtn = $('#togglePassword');
    const passwordInput = $('#password');

    loginForm.submit(function(event) {
        event.preventDefault();

        const formData = $(this).serialize();

        $.ajax({
            url: '/login',
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showMessage('Login successful. Redirecting to dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showMessage(response.message || 'Login failed. Please try again.', 'error');
                }
            },
            error: function(xhr, status, error) {
                showMessage('An error occurred. Please try again.', 'error');
                console.error('Login error:', error);
            }
        });
    });

    togglePasswordBtn.on('click', function() {
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    function showMessage(message, type) {
        messageDiv.removeClass('success error').addClass(type).text(message).show();
        setTimeout(() => {
            messageDiv.fadeOut();
        }, 5000);
    }

    // Add input validation
    loginForm.find('input').on('input', function() {
        $(this).removeClass('invalid');
    });

    loginForm.on('submit', function() {
        let isValid = true;
        $(this).find('input[required]').each(function() {
            if (!$(this).val()) {
                $(this).addClass('invalid');
                isValid = false;
            }
        });
        return isValid;
    });
});