$(document).ready(function() {

    // Appointment form submission with AJAX
    $('#appointmentForm').on('submit', function(event) {
        event.preventDefault();

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
});
