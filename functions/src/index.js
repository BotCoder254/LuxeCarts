const functions = require('firebase-functions');

const admin = require('firebase-admin');

const stripe = require('stripe')('sk_test_51JMihKFmxId2hxxFTAnAHR0RmO7tmiaMbHzl3QcnVIjx2GkHVG1n7lvDNFARVXPqiTg9YhJnQbHCc9YAlwODrGjJ00814iNd6B', {
  apiVersion: '2023-10-16'
});



admin.initializeApp();



exports.createPaymentIntent = functions.https.onCall(async (data, context) => {

  try {

    // Verify authentication

    if (!context.auth) {

      throw new functions.https.HttpsError(

        'unauthenticated',

        'You must be logged in to make a payment'

      );

    }



    const { amount, currency = 'usd', customer_email } = data;



    // Validate amount

    if (!amount || amount <= 0) {

      throw new functions.https.HttpsError(

        'invalid-argument',

        'Invalid payment amount'

      );

    }



    // Create payment intent with explicit payment method types

    const paymentIntent = await stripe.paymentIntents.create({

      amount,

      currency,

      receipt_email: customer_email,

      payment_method_types: ['card'],

      metadata: {

        userId: context.auth.uid,

      },

    });



    if (!paymentIntent || !paymentIntent.client_secret) {

      throw new functions.https.HttpsError(

        'internal',

        'Failed to create payment intent'

      );

    }



    return {

      clientSecret: paymentIntent.client_secret,

    };

  } catch (error) {

    console.error('Error creating payment intent:', error);

    if (error instanceof functions.https.HttpsError) {

      throw error;

    }

    if (error.type === 'StripeCardError') {

      throw new functions.https.HttpsError(

        'failed-precondition',

        error.message || 'Your card was declined'

      );

    }

    if (error.type === 'StripeInvalidRequestError') {

      throw new functions.https.HttpsError(

        'invalid-argument',

        'Invalid payment information provided'

      );

    }

    throw new functions.https.HttpsError(

      'unknown',

      'An unexpected error occurred while processing your payment. Please try again.'

    );

  }

});



// Handle successful payments

exports.handleSuccessfulPayment = functions.firestore

  .document('orders/{orderId}')

  .onCreate(async (snap, context) => {

    const order = snap.data();

    const orderId = context.params.orderId;



    try {

      // Send confirmation email

      await sendOrderConfirmationEmail(order);



      // Update inventory

      await updateInventory(order.items);



      // Update order status

      await snap.ref.update({

        status: 'confirmed',

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      });



      return { success: true };

    } catch (error) {

      console.error('Error processing order:', error);

      await snap.ref.update({

        status: 'error',

        error: error.message,

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      });

      return { success: false, error: error.message };

    }

  });



// Helper function to send order confirmation email

async function sendOrderConfirmationEmail(order) {

  // Implement your email sending logic here

  // You can use services like SendGrid, Mailgun, etc.

}



// Helper function to update inventory

async function updateInventory(items) {

  const db = admin.firestore();

  const batch = db.batch();



  for (const item of items) {

    const productRef = db.collection('products').doc(item.id);

    batch.update(productRef, {

      stock: admin.firestore.FieldValue.increment(-item.quantity),

    });

  }



  await batch.commit();

}



// Webhook to handle Stripe events

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {

  const signature = req.headers['stripe-signature'];

  const endpointSecret = functions.config().stripe.webhook_secret;



  try {

    const event = stripe.webhooks.constructEvent(

      req.rawBody,

      signature,

      endpointSecret

    );



    switch (event.type) {

      case 'payment_intent.succeeded':

        await handlePaymentSuccess(event.data.object);

        break;

      case 'payment_intent.payment_failed':

        await handlePaymentFailure(event.data.object);

        break;

      default:

        console.log(`Unhandled event type ${event.type}`);

    }



    res.json({ received: true });

  } catch (err) {

    console.error('Webhook Error:', err.message);

    res.status(400).send(`Webhook Error: ${err.message}`);

  }

});



async function handlePaymentSuccess(paymentIntent) {

  const orderId = paymentIntent.metadata.orderId;

  if (orderId) {

    const db = admin.firestore();

    await db.collection('orders').doc(orderId).update({

      status: 'paid',

      paymentStatus: 'completed',

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    });

  }

}



async function handlePaymentFailure(paymentIntent) {

  const orderId = paymentIntent.metadata.orderId;

  if (orderId) {

    const db = admin.firestore();

    await db.collection('orders').doc(orderId).update({

      status: 'payment_failed',

      paymentStatus: 'failed',

      error: paymentIntent.last_payment_error?.message,

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    });

  }

} 
