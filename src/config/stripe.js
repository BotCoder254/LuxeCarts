import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9CA3AF',
      },
      padding: '16px',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true, // We collect it in the shipping form
};

export const handleStripeError = (error) => {
  let message = 'An error occurred. Please try again.';

  if (error.type === 'card_error' || error.type === 'validation_error') {
    message = error.message;
  } else {
    switch (error.code) {
      case 'card_declined':
        message = 'Your card was declined. Please try another card.';
        break;
      case 'expired_card':
        message = 'Your card has expired. Please try another card.';
        break;
      case 'incorrect_cvc':
        message = 'Incorrect CVC code. Please check and try again.';
        break;
      case 'processing_error':
        message = 'An error occurred while processing your card. Please try again.';
        break;
      case 'incorrect_number':
        message = 'Your card number is invalid. Please check and try again.';
        break;
      default:
        message = error.message || 'Something went wrong. Please try again.';
    }
  }

  return message;
}; 