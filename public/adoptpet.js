document.getElementById('payBtn').addEventListener('click', function (e) {
    e.preventDefault();  // Prevent form submission for now

    const form = document.getElementById('adoptForm');
    const amount = 500; // Example adoption fee in INR (in paisa)
    const formData = new FormData(form); // Collect form data

    // Call backend to create Razorpay order
    fetch('/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
    })
    .then(response => response.json())
    .then(order => {
        var options = {
            "key": "YOUR_TEST_KEY_ID",  // Replace with your actual Razorpay key
            "amount": order.amount,  // Amount in paisa
            "currency": order.currency,
            "name": "Pet Adoption",
            "description": "Adopt a Pet",
            "order_id": order.id,  // Order ID from backend
            "handler": function (response) {
                // After successful payment, handle the form submission
                alert("Payment successful! Thank you for adopting!");

                // Add payment details to the form and submit it to the backend
                formData.append("paymentId", response.razorpay_payment_id);
                formData.append("orderId", response.razorpay_order_id);
                formData.append("signature", response.razorpay_signature);

                // Submit form to the backend to save adoption details and payment status
                fetch('/submit-adopt-form', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    alert('Adoption successful! You will be contacted soon.');
                    window.location.href = '/thank-you'; // Redirect to a Thank You page or confirmation
                });
            },
            "prefill": {
                "name": formData.get('FirstName'),  // Use user's name from form
                "email": formData.get('EmailAdd'),
                "contact": formData.get('PhoneNum')
            },
            "theme": {
                "color": "#ff7043"
            }
        };

        var rzp1 = new Razorpay(options);
        rzp1.open();  // Open Razorpay modal
    })
    .catch(error => {
        console.error('Error:', error);
    });
});