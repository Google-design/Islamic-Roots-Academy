const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-2' });

exports.handler = async (event) => {
  try {
    // Step 1: Parse Stripe Webhook Event
    const stripeEvent = JSON.parse(event.body);
    if (stripeEvent.type !== 'checkout.session.completed') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid event type" }),
      };
    }

    // Step 2: Extract Client Email and Success URL
    const name = stripeEvent.data.object.customer_details.name;
    const email = stripeEvent.data.object.customer_details.email;
    const successUrl = stripeEvent.data.object.success_url;

    // Step 3: Parse Query Parameters from Success URL
    const urlParams = new URLSearchParams(successUrl.split('?')[1]);
    const serviceBooked = urlParams.get('serviceBooked') || "N/A";
    const staffBooked = urlParams.get('staffBooked') || "N/A";
    const dateBooked = urlParams.get('dateBooked') || "N/A";
    const timeBooked = urlParams.get('timeBooked') || "N/A";

    const staticZoomLink = "https://zoom.us/j/1234567890";
    const confirmationNumber = stripeEvent.data.object.id.slice(-9);

    // Step 4: Compose Email
    const emailParams = {
      Source: "contact@islamicrootsacademy.com", // Your verified SES email
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Islamic Roots Academy - Booking Confirmation Details - ${confirmationNumber}` },
        Body: {
          Html: {
            Data: `
              <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <img src="https://islamic-roots-academy.s3.us-east-2.amazonaws.com/Logo_New.png" 
               alt="Islamic Roots Academy Logo" 
               style="max-width: 80px; margin-right: 15px;">
          <h2 style="margin: 0; font-size: 18px; color: #444;">Islamic Roots Academy</h2>
        </div>
        
        <p style="font-size: 16px; color: #444;">Assalamualaikum, ${name}</p>
        <p style="font-size: 16px; color: #444;">Thank you for booking. Here are your booking details:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Service Booked:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${serviceBooked}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Staff Booked:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${staffBooked}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Date Booked:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${dateBooked}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Time Booked:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${timeBooked}</td>
          </tr>
        </table>

        <p style="font-size: 16px; color: #444;"><strong>Your confirmation number is:</strong> ${confirmationNumber}</p>
        <p style="font-size: 16px; color: #444;">
          <a href="${staticZoomLink}" style="color: #1a73e8; text-decoration: none; font-weight: bold;">Join your meeting here</a>
        </p>
        <p style="font-size: 16px; color: #444;">
          Islamic Roots Academy Team<br>
          <a href="https://islamicrootsacademy.com/" style="color: #1a73e8; text-decoration: none; font-weight: bold;">Islamic Roots Academy</a>
        </p>
      </body>
      </html>
            `,
          },
        },
      },
    };

    // Step 5: Send Email with SES
    await ses.sendEmail(emailParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Internal server error: ${error.message}` }),
    };
  }
};
