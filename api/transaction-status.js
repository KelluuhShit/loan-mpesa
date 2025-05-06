const axios = require('axios');

module.exports = async (req, res) => {
  const { reference } = req.query;
  console.log(`[${new Date().toISOString()}] Transaction status requested - Reference: ${reference}`);

  if (!reference) {
    console.log('Missing reference parameter');
    return res.status(400).json({ success: false, error: 'Missing reference' });
  }

  try {
    const apiUsername = process.env.PAYHERO_API_USERNAME;
    const apiPassword = process.env.PAYHERO_API_PASSWORD;
    if (!apiUsername || !apiPassword) {
      throw new Error('Missing PayHero API credentials');
    }
    const authToken = `Basic ${Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64')}`;

    const response = await axios.get(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`,
      {
        headers: { Authorization: authToken, 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const statusData = response.data;
    let normalizedStatus;

    if (statusData.status === 'SUCCESS') {
      normalizedStatus = 'SUCCESS';
    } else if (statusData.status === 'FAILED' && statusData.error_message?.toLowerCase().includes('cancel')) {
      normalizedStatus = 'CANCELLED';
    } else if (statusData.status === 'FAILED') {
      normalizedStatus = 'FAILED';
    } else if (statusData.status === 'CANCELLED') {
      normalizedStatus = 'CANCELLED';
    } else {
      normalizedStatus = 'QUEUED';
    }

    console.log(`Status for ${reference}: ${normalizedStatus}`);
    res.json({
      success: true,
      status: normalizedStatus,
      data: statusData,
    });
  } catch (error) {
    console.error('Transaction status error:', error.message, error.response?.data);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
};