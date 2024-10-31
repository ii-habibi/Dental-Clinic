$(document).ready(function () {
    // Modal functionality
    const modal = $("#appointmentFormModal");
    const openModalBtn = $("#openAppointmentForm");
    const closeModalBtn = $(".close");

    openModalBtn.click(() => modal.css("display", "block"));

    closeModalBtn.click(() => {
        modal.css("display", "none");
        location.reload();
    });

    $(window).click((event) => {
        if (event.target === modal[0]) {
            modal.css("display", "none");
            location.reload();
        }
    });

    // Form submission handling
    $('#appointmentForm').on('submit', function (event) {
        event.preventDefault();
        const formData = $(this).serializeArray();
        const data = {};
        formData.forEach(item => (data[item.name] = item.value));

        $.ajax({
            url: '/dashboard/appointments',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                alert(response.message === 'Appointment booked successfully'
                    ? 'Appointment booked successfully!'
                    : response.message
                );
                if (response.message === 'Appointment booked successfully') $('#appointmentForm')[0].reset();
            },
            error: (xhr) => {
                const response = xhr.responseJSON;
                alert(response && response.message
                    ? response.message
                    : 'An error occurred while booking the appointment.'
                );
                console.error('Error booking appointment:', xhr.status, xhr.statusText);
            }
        });
    });

    // Event delegation for approve, reject, complete, and delete actions
    $(document).on('click', '.btn-approve, .btn-reject, .btn-completed, .delete-button', function () {
        const $button = $(this);
        const appointmentId = $button.data('id');
        const status = $button.data('status');

        if ($button.hasClass('delete-button')) {
            handleDelete(appointmentId);
        } else {
            handleStatusChange(appointmentId, status);
        }
    });

    // Delete appointment handler
    function handleDelete(appointmentId) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            $.ajax({
                url: `/dashboard/appointments/delete/${appointmentId}`,
                type: 'DELETE',
                success: (data) => {
                    $(`#appointment-${appointmentId}`).remove();
                    alert(data.message);
                },
                error: (xhr) => {
                    const response = xhr.responseJSON;
                    console.error('Error response:', xhr.responseText);
                    alert(response ? response.message : 'An error occurred while deleting the appointment.');
                }
            });
        }
    }

    // Status change handler
    function handleStatusChange(appointmentId, status) {
        const confirmMessage = `Are you sure you want to ${
            status === 'Approved' ? 'approve' : status === 'Rejected' ? 'reject' : 'mark as completed'
        } this appointment?`;

        if (confirm(confirmMessage)) {
            $.ajax({
                url: `/dashboard/appointments/status/${appointmentId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status }),
                success: (data) => {
                    updateStatusDisplay(appointmentId, status);
                    alert(data.message);
                },
                error: (xhr) => {
                    const response = xhr.responseJSON;
                    console.error('Error response:', xhr.responseText);
                    alert(response ? response.message : 'An error occurred while updating the status.');
                }
            });
        }
    }

    // Update status display in the table
    function updateStatusDisplay(appointmentId, status) {
        const $statusText = $(`#appointment-${appointmentId} .status-text`);
        $statusText
            .text(status)
            .removeClass('status-pending status-approved status-rejected status-completed')
            .addClass(`status-${status.toLowerCase()}`);

        // Update buttons based on status
        const $appointmentRow = $(`#appointment-${appointmentId}`);
        if (status === 'Approved') {
            $appointmentRow.find('.btn-approve, .btn-reject').remove();
            $appointmentRow.find('td:last-child').append(`
                <button class="btn-status btn-completed" data-id="${appointmentId}" data-status="Completed">Completed</button>
            `);
        } else if (status === 'Rejected') {
            $appointmentRow.find('.btn-approve, .btn-reject').remove();
        } else if (status === 'Completed') {
            $appointmentRow.find('.btn-completed').remove();
        }
    }
});
