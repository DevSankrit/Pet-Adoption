#!/bin/bash

SENDGRID_API_KEY=$4  # Make sure this is correctly captured
email=$1
subject=$2
content=$3

# Log for debugging
echo "Preparing to send email:"
echo "To: $email"
echo "Subject: $subject"
echo "Content: $content"

# Send the email using SendGrid API
response=$(curl -s --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"personalizations\": [{
      \"to\": [{\"email\": \"$email\"}]
    }],
    \"from\": {\"email\": \"devsankrit@gmail.com\"},
    \"subject\": \"$subject\",
    \"content\": [{
      \"type\": \"text/plain\",
      \"value\": \"$content\"
    }]
  }")

# Check if the email was sent successfully
if [ $? -eq 0 ]; then
    echo "Response from SendGrid: $response"  # Log response for debugging
    echo "Email sent successfully!"
else
    echo "Failed to send email. Response: $response"
    exit 1
fi
