 // main.js

document.addEventListener('DOMContentLoaded', function () {
    // Check if the user is logged in (you may have a more sophisticated authentication mechanism)
    const isLoggedIn = checkLoggedInStatus();

    // If the user is logged in, show the booking form and admin link
    if (isLoggedIn) {
        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('adminLink').style.display = 'block';
    }

    // Handle booking form submission
    document.getElementById('bookingForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Get booking details from the form
        const customerName = document.getElementById('customerName').value;
        const roomType = document.getElementById('roomType').value;
        const checkInDate = document.getElementById('checkInDate').value;
        const checkOutDate = document.getElementById('checkOutDate').value;

        // Perform validation (you may want to add more sophisticated validation)
        if (!customerName || !roomType || !checkInDate || !checkOutDate) {
            alert('Please fill in all fields');
            return;
        }

        // Send a request to the server to handle the booking
        bookRoom(customerName, roomType, checkInDate, checkOutDate);
    });

    // Handle admin link click (assuming you have a route for the admin panel)
    document.getElementById('adminLink').addEventListener('click', function () {
        window.location.href = '/admin';
    });

    // Helper function to check if the user is logged in (replace with your authentication logic)
    function checkLoggedInStatus() {
        // Replace this with your actual authentication check
        // For simplicity, let's assume a global variable isAuthenticated is set elsewhere
        return isAuthenticated;
    }

    // Helper function to send a booking request to the server
    function bookRoom(customerName, roomType, checkInDate, checkOutDate) {
        // Replace this with your actual API endpoint for booking
        const apiUrl = '/api/bookings';

        // Replace this with your preferred method for making asynchronous requests (e.g., fetch, axios)
        // Here, we're using the fetch API for simplicity
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerName: customerName,
                roomType: roomType,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to book room');
            }
            return response.json();
        })
        .then(data => {
            alert('Room booked successfully!');
        })
        .catch(error => {
            console.error('Error booking room:', error);
            alert('Failed to book room. Please try again.');
        });
    }
});

