const stripe = require('stripe')('sk_test_51QXV2HJdgLdisV6J1ixkyNi5wFP41vX3B5j6SrPo3wC9jeZiSKQQ1BdqWPle5kq8tslBEhnNGcQwWQfooxSfsJbg00qk2EIRPj');

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        const { sessionId } = body;

        if (!sessionId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing sessionId" }),
            };
        }

        // Retrieve the session details
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Payment verified", session }),
            };
        } else {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: "Payment not completed", session }),
            };
        }
    } catch (error) {
        if (error.type === 'StripeInvalidRequestError') {
            // Handle invalid request errors (e.g., invalid sessionId)
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid sessionId or bad request" }),
            };
        } else {
            // Handle other types of errors (e.g., network issues)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Internal server error", details: error.message }),
            };
        }
    }
};
