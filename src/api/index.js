if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
  const axios = require('axios');
  
  module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', 'https://tengeneza-pesa.vercel.app');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }
  
    if (req.method !== 'POST') {
      res.setHeader('Access-Control-Allow-Origin', 'https://tengeneza-pesa.vercel.app');
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  
    res.setHeader('Access-Control-Allow-Origin', 'https://tengeneza-pesa.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    const { phoneNumber, amount, reference } = req.body;
    console.log(`STK Push requested - Phone: ${phoneNumber}, Amount: ${amount}, Reference: ${reference}`);
  
    if (!phoneNumber || !amount || !reference) {
      return res.status(400).json({ success: false, error: 'Missing phoneNumber, amount, or reference' });
    }
  
    const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;
    if (!/^(254[17]\d{8})$/.test(formattedPhone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX' });
    }
  
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }
  
    try {
      const apiUsername = process.env.PAYHERO_API_USERNAME;
      const apiPassword = process.env.PAYHERO_API_PASSWORD;
      const authToken = `Basic ${Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64')}`;
      const callbackUrl = `https://${req.headers.host}/api/payhero-callback`;
  
      const payload = {
        amount: Number(amount),
        phone_number: formattedPhone,
        channel_id: 1874,
        provider: 'm-pesa',
        external_reference: reference,
        callback_url: callbackUrl,
      };
  
      const response = await axios.post(
        'https://backend.payhero.co.ke/api/v2/payments',
        payload,
        {
          headers: { Authorization: authToken, 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
  
      if (response.data.status === 'QUEUED' || response.data.success) {
        const paymentReference = response.data.reference || reference;
        res.json({
          success: true,
          reference: paymentReference,
          message: 'STK Push initiated',
        });
      } else {
        res.status(400).json({ success: false, error: 'STK Push initiation failed', data: response.data });
      }
    } catch (error) {
      const errorData = error.response?.data || error.message;
      console.error(`STK Push error: ${JSON.stringify(errorData)}`);
      res.status(500).json({
        success: false,
        error: errorData.error_message || 'An unexpected error occurred',
      });
    }
  };