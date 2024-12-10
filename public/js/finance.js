// public/js/finance.js
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

    // Modal elements
    const manualAdjustmentModal = $("#manualAdjustmentModal");
    const editManualAdjustmentModal = $("#editManualAdjustmentModal");
    const closeBtns = $(".close");

    // Function to reset all forms
    function resetAllForms() {
        $('#manualAdjustmentForm')[0].reset();
        $('#editManualAdjustmentForm')[0].reset();
    }

    // Open Manual Adjustment Modal
    $('#openManualAdjustmentModal').click(() => {
        manualAdjustmentModal.css("display", "block");
    });

    // Close any modal when 'x' is clicked
    closeBtns.click(function() {
        $(this).closest('.modal').css("display", "none");
        resetAllForms();
    });

    // Close modals when clicking outside the modal content
    $(window).click((event) => {
        if (
            event.target === manualAdjustmentModal[0] ||
            event.target === editManualAdjustmentModal[0]
        ) {
            manualAdjustmentModal.css("display", "none");
            editManualAdjustmentModal.css("display", "none");
            resetAllForms();
        }
    });

    // Initialize Chart.js instances globally
    let financialChart;
    let expensePieChart;

    /**
     * Financial Summary Functionality
     */

    // Function to fetch and display financial summary
    function fetchFinancialSummary() {
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        // Validate Date Inputs
        if (!startDate || !endDate) {
            alert('Please select both Start Date and End Date.');
            return;
        }

        // Ensure Start Date is before End Date
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start Date cannot be after End Date.');
            return;
        }

        // Show Loading Indicator
        // $('.summary-results').html('<p>Loading...</p>');

        // Make AJAX GET Request to Fetch Summary
        $.ajax({
            url: '/dashboard/finance/summary',
            type: 'GET',
            data: { startDate, endDate },
            success: function(response) {
                console.log("Summary:", response);
                $('#totalIncome').text(response.totalIncome);
                $('#totalExpenses').text(response.totalExpenses);
                $('#netIncome').text(response.netIncome);

                // Fetch data for bar chart
                fetchFinancialChartData(startDate, endDate);

                // Fetch data for expense pie chart
                fetchExpenseCategories(startDate, endDate);

                // Fetch manual adjustments
                fetchManualAdjustments(startDate, endDate);
            },
            error: function(xhr) {
                console.error('Error fetching financial summary:', xhr);
                alert('Failed to fetch financial summary. Status: ' + xhr.status + ' - ' + xhr.responseText);
                $('.summary-results').html('<p>Error loading data.</p>');
            }
        });
    }

    // Function to fetch financial summary on button click
    $('#fetchFinancialSummary').click(function() {
        fetchFinancialSummary();
    });

    // Function to reset filters
    $('#resetFilters').click(function() {
        $('#startDate').val('');
        $('#endDate').val('');
        $('.summary-results').html('<p>Total Income: PKR <span id="totalIncome">0.00</span></p><p>Total Expenses: PKR <span id="totalExpenses">0.00</span></p><p>Net Income: PKR <span id="netIncome">0.00</span></p>');
        if (financialChart) financialChart.destroy();
        if (expensePieChart) expensePieChart.destroy();
        $('#manualAdjustmentsTable tbody').empty();
    });

    /**
     * Chart Functionality
     */

    // Function to fetch data for financial bar chart
    function fetchFinancialChartData(startDate, endDate) {
        $.ajax({
            url: '/dashboard/finance/chart-data',
            type: 'GET',
            data: { startDate, endDate },
            success: function(data) {
                console.log("Chart Data:", data);
                renderFinancialBarChart(data);
            },
            error: function(xhr) {
                console.error('Error fetching chart data:', xhr);
                alert('Failed to fetch financial chart data. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    }

    // Function to render financial bar chart
    function renderFinancialBarChart(data) {
        const ctx = document.getElementById('financialChart').getContext('2d');

        if (financialChart) {
            financialChart.destroy();
        }

        financialChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.income,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)'
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (PKR)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Income and Expenses'
                    }
                }
            }
        });
    }

    // Function to fetch data for expense pie chart
    function fetchExpenseCategories(startDate, endDate) {
        $.ajax({
            url: '/dashboard/finance/expense-categories',
            type: 'GET',
            data: { startDate, endDate },
            success: function(data) {
                console.log("Expense Categories:", data);
                renderExpensePieChart(data);
            },
            error: function(xhr) {
                console.error('Error fetching expense categories:', xhr);
                alert('Failed to fetch expense categories. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    }

    // Function to render expense pie chart
    function renderExpensePieChart(data) {
        const ctx = document.getElementById('expensePieChart').getContext('2d');

        if (expensePieChart) {
            expensePieChart.destroy();
        }

        const labels = data.map(item => item.type);
        const expenses = data.map(item => parseFloat(item.total));

        // Generate distinct colors for each slice
        const backgroundColors = labels.map(() => getRandomColor());

        expensePieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: expenses,
                    backgroundColor: backgroundColors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Expenses by Category'
                    }
                }
            },
        });
    }

    // Utility function to generate random color
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /**
     * Manual Adjustments Functionality
     */

    // Function to fetch manual adjustments
    function fetchManualAdjustments(startDate, endDate) {
        $.ajax({
            url: '/dashboard/finance/incomes',
            type: 'GET',
            data: { startDate, endDate },
            success: function(data) {
                console.log("Income Get:", data);
                populateManualAdjustmentsTable(data);
            },
            error: function(xhr) {
                console.error('Error fetching manual adjustments:', xhr);
                alert('Failed to fetch manual adjustments. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    }

    // Function to populate manual adjustments table
    function populateManualAdjustmentsTable(data) {
        const tbody = $('#manualAdjustmentsTable tbody');
        tbody.empty();

        if (data.length === 0) {
            tbody.append('<tr><td colspan="5">No manual adjustments found.</td></tr>');
            return;
        }

        data.forEach(adjustment => {
            tbody.append(`
                <tr data-id="${adjustment.id}">
                    <td>${adjustment.id}</td>
                    <td>${adjustment.description}</td>
                    <td>PKR ${parseFloat(adjustment.amount).toFixed(2)}</td>
                    <td>${new Date(adjustment.date).toLocaleDateString('en-US')}</td>
                    <td>
                        <button class="btn btn-edit-adjustment" data-id="${adjustment.id}">Edit</button>
                        <button class="btn btn-delete-adjustment" data-id="${adjustment.id}">Delete</button>
                    </td>
                </tr>
            `);
        });
    }

    // Handle Manual Adjustment Form Submission
    $('#manualAdjustmentForm').on('submit', function(event) {
        event.preventDefault();
        const description = $('#description').val().trim();
        const amount = parseFloat($('#amount').val());
        const date = $('#adjustmentDate').val();

        if (!description || isNaN(amount) || amount <= 0 || !date) {
            alert('Please provide valid description, amount, and date.');
            return;
        }

        $.ajax({
            url: '/dashboard/finance/incomes',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ description, amount, date }),
            success: function(response) {
                console.log("Income Post:", response);
                alert(response.message);
                manualAdjustmentModal.css("display", "none");
                resetAllForms();
                fetchFinancialSummary();
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                alert(response && response.message ? response.message : 'An error occurred while adding the adjustment. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    });

    // Handle Edit Adjustment Button Click
    $(document).on('click', '.btn-edit-adjustment', function() {
        const adjustmentId = $(this).data('id');

        // Fetch adjustment details
        $.ajax({
            url: `/dashboard/finance/incomes/${adjustmentId}`,
            type: 'GET',
            success: function(response) {
                console.log("Incomes with id Get:", response);
                const adjustment = response.income;
                if (adjustment) {
                    $('#editAdjustmentId').val(adjustment.id);
                    $('#editDescription').val(adjustment.description);
                    $('#editAmount').val(adjustment.amount);
                    $('#editAdjustmentDate').val(adjustment.date.split('T')[0]);
                    editManualAdjustmentModal.css("display", "block");
                } else {
                    alert('Adjustment not found.');
                }
            },
            error: function(xhr) {
                console.error('Error fetching adjustment details:', xhr);
                alert('Failed to fetch adjustment details. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    });

    // Handle Manual Adjustment Edit Form Submission
    $('#editManualAdjustmentForm').on('submit', function(event) {
        event.preventDefault();
        const id = $('#editAdjustmentId').val();
        const description = $('#editDescription').val().trim();
        const amount = parseFloat($('#editAmount').val());
        const date = $('#editAdjustmentDate').val();

        if (!description || isNaN(amount) || amount <= 0 || !date) {
            alert('Please provide valid description, amount, and date.');
            return;
        }

        $.ajax({
            url: `/dashboard/finance/incomes/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ description, amount, date }),
            success: function(response) {
                console.log("Income PUT:", response);
                alert(response.message);
                editManualAdjustmentModal.css("display", "none");
                resetAllForms();
                fetchFinancialSummary();
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                alert(response && response.message ? response.message : 'An error occurred while updating the adjustment. Status: ' + xhr.status + ' - ' + xhr.responseText);
            }
        });
    });

    // Handle Delete Adjustment Button Click
    $(document).on('click', '.btn-delete-adjustment', function() {
        const adjustmentId = $(this).data('id');

        if (confirm('Are you sure you want to delete this adjustment?')) {
            $.ajax({
                url: `/dashboard/finance/incomes/${adjustmentId}`,
                type: 'DELETE',
                success: function(response) {
                    console.log("Income Delete:", response);
                    alert(response.message);
                    fetchFinancialSummary();
                },
                error: function(xhr) {
                    const response = xhr.responseJSON;
                    alert(response && response.message ? response.message : 'An error occurred while deleting the adjustment. Status: ' + xhr.status + ' - ' + xhr.responseText);
                }
            });
        }
    });

    /**
     * Utility Functions
     */

    // Utility function to generate random color
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /**
     * Initial Load
     */

    // Set default date range to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    $('#startDate').val(firstDayOfMonth);
    $('#endDate').val(lastDayOfMonth);
    fetchFinancialSummary();

    /**
     * Responsive behavior for sidebar
     */
    $(window).resize(function() {
        if ($(window).width() > 768) {
            $('.sidebar').removeClass('active');
        }
    });
});
