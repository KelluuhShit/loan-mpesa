import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { initiateSTKPush, checkTransactionStatus } from '../api/api';

function Checkout() {
  const { state } = useLocation();
  const { loanAmount } = state || { loanAmount: 0 };
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const generateReference = () => `KOPA_${Date.now()}`;

  const handleCheckout = async () => {
    if (!phoneNumber) {
      setError('Please enter your M-Pesa phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ref = generateReference();
      const response = await initiateSTKPush({
        phoneNumber,
        amount: loanAmount,
        reference: ref,
      });
      if (response.success) {
        setReference(response.reference);
        setStatus('QUEUED');
      } else {
        setError(response.error || 'Failed to initiate STK Push');
        setLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!reference || status !== 'QUEUED') return;

    const pollStatus = async () => {
      try {
        const response = await checkTransactionStatus(reference);
        if (response.success) {
          setStatus(response.status);
          if (response.status === 'SUCCESS') {
            setLoading(false);
            alert('Loan disbursed successfully!');
            navigate('/');
          } else if (response.status === 'FAILED' || response.status === 'CANCELLED') {
            setError('Transaction failed or was cancelled');
            setLoading(false);
          }
        }
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [reference, status, navigate]);

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h1" gutterBottom>
          Loan Checkout
        </Typography>
        <Typography variant="body1" gutterBottom>
          Loan Amount: KSh {loanAmount.toLocaleString()}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Repayment: 6% monthly interest over 6 months
        </Typography>
        <Typography variant="body1" gutterBottom>
          Enter your M-Pesa phone number to receive funds.
        </Typography>
        {error && (
          <Typography variant="body1" color="secondary" gutterBottom>
            {error}
          </Typography>
        )}
        {status && (
          <Typography variant="body1" gutterBottom>
            Transaction Status: {status}
          </Typography>
        )}
        <TextField
          fullWidth
          label="M-Pesa Phone Number (e.g., 07XXXXXXXX)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          variant="outlined"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckout}
          disabled={loading}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loading ? 'Processing...' : 'Confirm Loan Request'}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/')}
          fullWidth
          sx={{ mt: 1 }}
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}

export default Checkout;