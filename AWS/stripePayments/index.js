const stripe = require('stripe')('sk_test_51QXV2HJdgLdisV6J1ixkyNi5wFP41vX3B5j6SrPo3wC9jeZiSKQQ1BdqWPle5kq8tslBEhnNGcQwWQfooxSfsJbg00qk2EIRPj');

exports.handler = async (event) => {
    try {
        // Parse the incoming request body
        const body = JSON.parse(event.body);
        const { serviceBooked, amount, productImageUrl, description, staffBooked, dateBooked, timeBooked } = body;

        // Validate inputs
        if (!serviceBooked || !amount || !productImageUrl || !description || !staffBooked || !dateBooked || !timeBooked) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required fields (serviceBooked, amount, productImageUrl, description, staffBooked, dateBooked, timeBooked)" }),
            };
        }

        // Create a Stripe Checkout Session with custom details
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Payment method
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd', // Currency
                        product_data: {
                            name: serviceBooked, // Name of the product or service
                            description: description, // Description
                            images: [productImageUrl],
                        },
                        unit_amount: amount * 100, // Amount in cents (e.g., $10 = 1000 cents)
                    },
                    quantity: 1, // Quantity of the product
                },
            ],
            
            // Customize branding settings
            payment_intent_data: {
                metadata: {
                    serviceBooked: serviceBooked, // Add custom metadata for tracking
                    staffBooked: staffBooked,
                    dateBooked: dateBooked,
                    timeBooked: timeBooked,
                },
            },

            success_url: `https://islamic-roots-academy.web.app/appointments?checkout_session_id={CHECKOUT_SESSION_ID}&step=5&serviceBooked=${encodeURIComponent(serviceBooked)}&staffBooked=${encodeURIComponent(staffBooked)}&dateBooked=${encodeURIComponent(dateBooked)}&timeBooked=${encodeURIComponent(timeBooked)}`, // Redirect URL on success
            cancel_url: 'https://islamic-roots-academy.web.app/appointments', // Redirect URL on cancel
        });

        // Return the checkout session URL to the user
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Checkout session created successfully",
                payment_link: session.url, // URL for the user to complete the payment
            }),
        };
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
