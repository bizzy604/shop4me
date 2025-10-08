console.log('Testing M-Pesa environment variables:');
console.log('MPESA_ENV:', process.env.MPESA_ENV);
console.log('MPESA_CONSUMER_KEY exists:', !!process.env.MPESA_CONSUMER_KEY);
console.log('MPESA_SECRET_KEY exists:', !!process.env.MPESA_SECRET_KEY);
console.log('MPESA_SHORTCODE:', process.env.MPESA_SHORTCODE);
console.log('MPESA_CALLBACK_URL exists:', !!process.env.MPESA_CALLBACK_URL);

if (process.env.MPESA_CONSUMER_KEY) {
  console.log('Consumer Key preview:', process.env.MPESA_CONSUMER_KEY.substring(0, 10) + '...');
}
