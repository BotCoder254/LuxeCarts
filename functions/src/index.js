const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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

// Handle M-Pesa callback
exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    const db = admin.firestore();
    
    // Find the order with this CheckoutRequestID
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.where('checkoutRequestId', '==', CheckoutRequestID).get();
    
    if (snapshot.empty) {
      console.error('No matching order found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderDoc = snapshot.docs[0];
    const order = orderDoc.data();

    if (ResultCode === 0) {
      // Payment successful
      await orderDoc.ref.update({
        status: 'processing',
        paymentStatus: 'completed',
        mpesaResult: stkCallback,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Payment failed
      await orderDoc.ref.update({
        status: 'payment_failed',
        paymentStatus: 'failed',
        mpesaResult: stkCallback,
        error: ResultDesc,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 