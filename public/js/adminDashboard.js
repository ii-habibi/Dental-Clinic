$(document).ready(function () {
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

    // Fetch total patients, returning patients, and upcoming appointments data
    function fetchDashboardData() {
        $.ajax({
            url: '/dashboard/data',
            method: 'GET',
            success: function (data) {
                console.log(data);
                let totalPatientsAppoint = data.totalPatients;
                $('#total-patients').text(totalPatientsAppoint.total_patients);
                $('#patients-this-month').text(totalPatientsAppoint.patients_this_month);
                $('#total-appointments').text(totalPatientsAppoint.total_appointments);
                $('#returning-patients').text(data.returningPatients);

                let appointmentsHtml = '';
                data.upcomingAppointments.forEach(function (appointment) {
                    appointmentsHtml += `
                        <tr>
                            <td>${appointment.patient_name}</td>
                            <td>${new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>${appointment.treatment_type}</td>
                            <td>${appointment.doctor_name}</td>
                            <td>${appointment.status}</td>
                        </tr>
                    `;
                });
                $('#appointments-table tbody').html(appointmentsHtml);

                let pendingAppointmentsHtml = '';
                data.pendingAppointment.forEach(function (appointment) {
                    pendingAppointmentsHtml += `
                        <tr>
                            <td>${appointment.patient_name}</td>
                            <td>${appointment.treatment_type}</td>
                            <td>${new Date(appointment.appointment_date).toLocaleDateString('en-US')}</td>
                        </tr>
                    `;
                });
                $('#pending-appointments-table tbody').html(pendingAppointmentsHtml);

                // Display updated appointments graph
                displayAppointmentsGraph(data.completedAppointmentsByMonth);
            }
        });
    }

    // Display Completed Appointments Graph using Chart.js
    function displayAppointmentsGraph(appointmentsByMonth) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const ctx = $('#appointments-bar-chart');
        const chartData = {
            labels: appointmentsByMonth.months.map(month => monthNames[month - 1]),
            datasets: [{
                label: 'Completed Appointments',
                data: appointmentsByMonth.completedCounts,
                backgroundColor: 'rgba(30, 136, 229, 0.6)',
                borderColor: 'rgba(30, 136, 229, 1)',
                borderWidth: 1
            }]
        };

        const options = {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Completed: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Appointments'
                    }
                }
            }
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });
    }

    // Initialize dashboard data fetch
    fetchDashboardData();

    // Responsive behavior for sidebar
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });
});