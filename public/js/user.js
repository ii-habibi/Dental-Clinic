$(document).ready(function() {

    // Appointment form submission with AJAX
    $('#appointmentForm').on('submit', function(event) {
        event.preventDefault();

        // Perform client-side validation
        if (!validateAppointmentForm()) {
            return;
        }

        const formData = $(this).serializeArray();
        const data = {};
        formData.forEach(item => {
            data[item.name] = item.value;
        });

        $.ajax({
            url: '/appointments/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.message === 'Appointment booked successfully') {
                    alert('Appointment booked successfully!');
                    $('#appointmentForm')[0].reset();
                    clearFormErrors();
                } else {
                    alert(response.message);
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                if (response && response.message) {
                    alert(response.message); // Show the server error message
                } else {
                    alert('An error occurred while booking the appointment.');
                }
                console.error('Error booking appointment:', xhr.status, xhr.statusText);
            }
        });
    });

    // Hamburger menu functionality
    const $hamburger = $('.hamburger');
    const $navMenu = $('.nav-menu');
    const $navLinks = $('.nav-link');

    $hamburger.on('click', function() {
        $hamburger.toggleClass('active');
        $navMenu.toggleClass('active');
    });

    $navLinks.on('click', function() {
        $hamburger.removeClass('active');
        $navMenu.removeClass('active');
    });

    // Blog description truncation and toggle functionality
    const characterLimit = 250; 

    $('.blog-description').each(function() {
        const $this = $(this);
        const fullText = $this.data('full-text');

        if (fullText.length > characterLimit) {
            const truncatedText = fullText.substring(0, characterLimit) + '...';
            $this.find('.truncated-text').text(truncatedText);
            $this.find('.full-text').text(fullText);
        } else {
            $this.find('.truncated-text').text(fullText);
            $this.find('.full-text').text('');
            $this.siblings('.see-more').hide();
        }
    });

    $('.see-more').on('click', function(e) {
        e.preventDefault();
        const $this = $(this);
        const $blogDescription = $this.siblings('.blog-description');

        $blogDescription.find('.truncated-text').toggle();
        $blogDescription.find('.full-text').toggle();

        if ($blogDescription.find('.full-text').is(':visible')) {
            $this.text('See Less');
        } else {
            $this.text('See More');
        }
    });

    // Form Validation Functions

    function clearFormErrors() {
        $('.error-message').text('');
        $('input, select, textarea').removeClass('input-error');
    }

    function validateAppointmentForm() {
        let isValid = true;
        clearFormErrors();

        // Validate Name (required)
        const name = $('#name').val().trim();
        if (name === '') {
            isValid = false;
            $('#name').addClass('input-error');
            $('#error-name').text('Name is required.');
        }

        // Validate Gender (required)
        const gender = $('#gender').val();
        if (gender === '') {
            isValid = false;
            $('#gender').addClass('input-error');
            $('#error-gender').text('Please select gender.');
        }

        // Validate Age (optional, max 120)
        const age = $('#age').val();
        if (age !== '') {
            const ageValue = parseInt(age, 10);
            if (isNaN(ageValue) || ageValue < 0 || ageValue > 120) {
                isValid = false;
                $('#age').addClass('input-error');
                $('#error-age').text('Age must be between 0 and 120.');
            }
        }

        // Validate Email (required)
        const email = $('#email').val().trim();
        if (email === '') {
            isValid = false;
            $('#email').addClass('input-error');
            $('#error-email').text('Email is required.');
        } else if (!validateEmail(email)) {
            isValid = false;
            $('#email').addClass('input-error');
            $('#error-email').text('Please enter a valid email address.');
        }

        // Validate Phone Number (exactly 11 digits)
        const phone = $('#phone').val().trim();
        const phoneRegex = /^\d{11}$/;
        if (phone === '') {
            isValid = false;
            $('#phone').addClass('input-error');
            $('#error-phone').text('Phone number is required.');
        } else if (!phoneRegex.test(phone)) {
            isValid = false;
            $('#phone').addClass('input-error');
            $('#error-phone').text('Phone number must be exactly 11 digits.');
        }

        // Validate Doctor Selection (required)
        const doctor = $('#doctor').val();
        if (doctor === '') {
            isValid = false;
            $('#doctor').addClass('input-error');
            $('#error-doctor').text('Please select a doctor.');
        }

        // Validate Date (required, not Sunday, not past)
        const date = $('#date').val();
        if (date === '') {
            isValid = false;
            $('#date').addClass('input-error');
            $('#error-date').text('Please select a date.');
        } else {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0,0,0,0); // Reset time for accurate comparison

            if (selectedDate < today) {
                isValid = false;
                $('#date').addClass('input-error');
                $('#error-date').text('Date cannot be in the past.');
            }

            if (selectedDate.getDay() === 0) { // 0 = Sunday
                isValid = false;
                $('#date').addClass('input-error');
                $('#error-date').text('Sundays are not available.');
            }
        }

        // Validate Time (required, between 08:00 and 18:00)
        const time = $('#time').val();
        if (time === '') {
            isValid = false;
            $('#time').addClass('input-error');
            $('#error-time').text('Please select a time.');
        } else {
            const [hours, minutes] = time.split(':').map(Number);
            if (hours < 8 || (hours === 18 && minutes > 0) || hours > 18) {
                isValid = false;
                $('#time').addClass('input-error');
                $('#error-time').text('Time must be between 08:00 and 18:00.');
            }
        }

        // Validate Treatment Type (required)
        const treatment = $('#treatment').val().trim();
        if (treatment === '') {
            isValid = false;
            $('#treatment').addClass('input-error');
            $('#error-treatment').text('Treatment type is required.');
        }

        // Validate Visit Type (required)
        const visitType = $('#visitType').val();
        if (visitType === '') {
            isValid = false;
            $('#visitType').addClass('input-error');
            $('#error-visitType').text('Please select visit type.');
        }

        return isValid;
    }

    function validateEmail(email) {
        // Simple email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Function to set date constraints on page load
    function setDateConstraints() {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const minDate = `${yyyy}-${mm}-${dd}`;
        $('#date').attr('min', minDate);

        // Disable Sundays dynamically
        $('#date').on('change', function() {
            const selectedDate = new Date($(this).val());
            if (selectedDate.getDay() === 0) { // 0 = Sunday
                alert('Sundays are not available for appointments.');
                $(this).val('');
            }
        });
    }

    // Initialize date constraints on page load
    setDateConstraints();

    // Function to display error messages dynamically (optional enhancement)
    // You can expand this based on your needs

});
