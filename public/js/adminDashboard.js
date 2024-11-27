$(document).ready(function () {
    function fetchDashboardData() {
        $.ajax({
            url: '/dashboard/data',
            method: 'GET',
            success: function (data) {
                updateDashboardStats(data.totalPatients);
                updateAppointmentsTables(data.upcomingAppointments, data.pendingAppointment);
                displayAppointmentsGraph(data.completedAppointmentsByMonth);
            },
            error: function (error) {
                console.error('Error fetching dashboard data:', error);
            }
        });
    }

    function updateDashboardStats(stats) {
        $('#total-patients').text(stats.total_patients);
        $('#patients-this-month').text(stats.patients_this_month);
        $('#total-appointments').text(stats.total_appointments);
        $('#returning-patients').text(stats.returning_patients);
    }

    function updateAppointmentsTables(upcomingAppointments, pendingAppointments) {
        let upcomingHtml = '';
        upcomingAppointments.forEach(function (appointment) {
            upcomingHtml += `
                <tr>
                    <td>${appointment.patient_name}</td>
                    <td>${formatDate(appointment.appointment_date)}</td>
                    <td>${appointment.treatment_type}</td>
                    <td>${appointment.doctor_name}</td>
                    <td>${appointment.status}</td>
                </tr>
            `;
        });
        $('#appointments-table tbody').html(upcomingHtml);

        let pendingHtml = '';
        pendingAppointments.forEach(function (appointment) {
            pendingHtml += `
                <tr>
                    <td>${appointment.patient_name}</td>
                    <td>${appointment.treatment_type}</td>
                    <td>${formatDate(appointment.appointment_date)}</td>
                </tr>
            `;
        });
        $('#pending-appointments-table tbody').html(pendingHtml);
    }

    function displayAppointmentsGraph(appointmentsByMonth) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const ctx = $('#appointments-bar-chart');
        const chartData = {
            labels: appointmentsByMonth.months.map(month => monthNames[month - 1]),
            datasets: [{
                label: 'Completed Appointments',
                data: appointmentsByMonth.completedCounts,
                backgroundColor: 'rgba(41, 128, 185, 0.6)',
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 1
            }]
        };

        const options = {
            responsive: true,
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

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    fetchDashboardData();

    // Refresh dashboard data every 5 minutes
    setInterval(fetchDashboardData, 300000);

    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    });
});

