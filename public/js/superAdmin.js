$(document).ready(function() {
  // Fetch and display all admins
  function fetchAdmins() {
    $.ajax({
      url: '/admins',
      type: 'GET',
      success: function(data) {
        $('#adminsList').empty();
        data.forEach(admin => {
          $('#adminsList').append(`
            <li>
              ${admin.name} (${admin.username}) - Super Admin: ${admin.is_super_admin ? 'Yes' : 'No'}
              <button class="deleteAdminBtn" data-id="${admin.id}" data-is-super-admin="${admin.is_super_admin}">Delete</button>
            </li>
          `);
        });
      },
      error: function() {
        alert('Failed to fetch admins.');
      }
    });
  }
  fetchAdmins();

  // Add a new admin
  $('#addAdminForm').on('submit', function(e) {
    e.preventDefault();
    const name = $('#newAdminName').val();
    const username = $('#newAdminUsername').val();
    const password = $('#newAdminPassword').val();
    const isSuperAdmin = $('#isSuperAdmin').val() === 'true';

    $.ajax({
      url: '/add-admin',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name, username, password, isSuperAdmin }),
      success: function(message) {
        alert(message);
        $('#newAdminName').val('');
        $('#newAdminUsername').val('');
        $('#newAdminPassword').val('');
        $('#isSuperAdmin').val('false');
        fetchAdmins();
      },
      error: function() {
        alert('Failed to add admin.');
      }
    });
  });

  // Delete an admin
  $('#adminsList').on('click', '.deleteAdminBtn', function() {
    const adminId = $(this).data('id');
    const isSuperAdmin = $(this).data('isSuperAdmin');

    let password = null;
    if (isSuperAdmin) {
        password = prompt("Enter password to delete a Super Admin:");
        if (!password) return; // Exit if no password provided
    }

    $.ajax({
        url: '/delete-admin',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ adminId, password }),
        success: function(message) {
            alert(message);
            fetchAdmins();
        },
        error: function() {
            alert('Failed to delete admin.');
        }
    });
  });

  // Update Super Admin credentials
  $('#updateSuperAdminForm').on('submit', function(e) {
    e.preventDefault();
    const currentPassword = $('#currentPassword').val();
    const username = $('#updateUsername').val();
    const newPassword = $('#updatePassword').val();

    $.ajax({
      url: '/update-super-admin',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ currentPassword, username, newPassword }),
      success: function(message) {
        alert(message);
        $('#currentPassword').val('');
        $('#updateUsername').val('');
        $('#updatePassword').val('');
      },
      error: function() {
        alert('Failed to update credentials.');
      }
    });
  });
});
