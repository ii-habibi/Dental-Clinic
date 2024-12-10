$(document).ready(function() {
    function fetchDoctors() {
        $.ajax({
            url: '/dashboard/expenses/doctors',
            type: 'GET',
            success: function(data) {
                const $doctorSelect = $('#doctorSelect');
                $doctorSelect.empty();
                $doctorSelect.append('<option value="">-- Select Doctor --</option>');
                data.forEach(doc => {
                    $doctorSelect.append(`<option value="${doc.id}">${doc.name}</option>`);
                });
            },
            error: function() {
                alert('Failed to fetch doctors.');
            }
        });
    }
    fetchDoctors();

    function fetchExpenses() {
        $.ajax({
            url: '/dashboard/expenses/expenses',
            type: 'GET',
            success: function(data) {
                const $tbody = $('#expenseHistoryTable tbody');
                $tbody.empty();

                if (data.length === 0) {
                    $tbody.append('<tr><td colspan="5">No expenses recorded yet.</td></tr>');
                } else {
                    data.forEach(expense => {
                        const date = new Date(expense.date).toLocaleString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                        });
                        const doctorName = expense.doctor_name || 'N/A';
                        const amount = parseFloat(expense.amount).toFixed(2);
                        const type = expense.type.charAt(0).toUpperCase() + expense.type.slice(1);
                        const description = expense.description || '';
                        $tbody.append(`
                            <tr>
                                <td>${date}</td>
                                <td>${doctorName}</td>
                                <td>${type}</td>
                                <td>${amount}</td>
                                <td>${description}</td>
                            </tr>
                        `);
                    });
                }
            },
            error: function() {
                alert('Failed to fetch expense history.');
            }
        });
    }
    fetchExpenses();

    $('#addExpenseForm').on('submit', function(e) {
        e.preventDefault();
        const doctor_id = $('#doctorSelect').val() || null;
        const amount = parseFloat($('#expenseAmount').val());
        const type = $('#expenseType').val();
        const description = $('#expenseDescription').val();

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        $.ajax({
            url: '/dashboard/expenses/expenses',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ doctor_id, amount, type, description }),
            success: function() {
                alert('Expense added successfully!');
                $('#doctorSelect').val('');
                $('#expenseAmount').val('');
                $('#expenseType').val('salary');
                $('#expenseDescription').val('');
                fetchExpenses();
            },
            error: function() {
                alert('Failed to add expense.');
            }
        });
    });
});
