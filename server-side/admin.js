async function fetchRequests() {
    const days = document.getElementById('filterDays').value;
    const response = await fetch(`/api/requests?days=${days}`);
    const data = await response.json();

    const requestsTableBody = document.getElementById('requestsTable').querySelector('tbody');
    requestsTableBody.innerHTML = ''; // Clear previous results

    data.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.staff_name}</td>
            <td>${request.staff_id}</td>
            <td>${request.department}</td>
            <td>${request.issue_type}</td>
            <td>${request.priority}</td>
            <td>${request.description}</td>
            <td>${new Date(request.created_at).toLocaleDateString()}</td>
        `;
        requestsTableBody.appendChild(row);
    });
}
