import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { analytics, logEvent } from '../firebaseConfig';

function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    loanAmount = 0,
    serviceFee = 0,
    trackingNumber = '',
    reference = '',
    phoneNumber = '',
    nationalId = '',
    fullName = '',
  } = state || {};

  const [status, setStatus] = useState('QUEUED');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Log state for debugging
  useEffect(() => {
    console.log('Checkout state:', state);
    if (!loanAmount || !trackingNumber || !reference || !phoneNumber) {
      logEvent(analytics, 'checkout_invalid_state', {
        nationalId,
        loanAmount,
        trackingNumber,
        reference,
        phoneNumber,
      });
    }
  }, [state, nationalId, loanAmount, trackingNumber, reference, phoneNumber]);

  // Poll transaction status
  useEffect(() => {
    if (!reference || status !== 'QUEUED') return;

    const maxPollingDuration = 300000; // 5 minutes
    const startTime = Date.now();

    const pollStatus = async () => {
      if (Date.now() - startTime > maxPollingDuration) {
        setError('Transaction timed out. Please contact support.');
        setErrorModalOpen(true);
        setLoading(false);
        console.log('Polling stopped due to timeout');
        logEvent(analytics, 'checkout_polling_timeout', {
          nationalId,
          reference,
          trackingNumber,
        });
        return;
      }

      let retries = 3;
      let timeout = 20000;
      while (retries > 0) {
        try {
          const apiUrl = process.env.NODE_ENV === 'production'
            ? process.env.REACT_APP_API_URL || 'https://kopa-mobile-to-mpesa.vercel.app'
            : 'http://localhost:3000';
          console.log(`Polling status for PayHero reference: ${reference}`);
          const response = await axios.get(`${apiUrl}/api/transaction-status?reference=${reference}`, {
            timeout,
          });

          console.log('Status response:', response.data);
          if (response.data.success) {
            const newStatus = response.data.status;
            setStatus(newStatus);
            logEvent(analytics, 'checkout_transaction_status', {
              nationalId,
              reference,
              trackingNumber,
              status: newStatus,
            });

            if (newStatus === 'SUCCESS') {
              setLoading(false);
              setSuccessModalOpen(true);
            } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
              setError('Transaction failed or was cancelled. Please try again.');
              setErrorModalOpen(true);
              setLoading(false);
            }
          } else {
            throw new Error('Failed to check transaction status');
          }
          return;
        } catch (err) {
          retries -= 1;
          timeout += 5000;
          console.error(`Status polling error (attempt ${4 - retries}):`, err);
          if (retries === 0) {
            let errorMessage = 'Error checking transaction status. Retrying...';
            if (err.response?.status === 404) {
              setStatus('QUEUED');
              errorMessage = 'Transaction is being processed. Please wait...';
            } else if (err.response?.status === 400) {
              errorMessage = 'Invalid transaction reference. Please contact support.';
            } else if (err.code === 'ECONNABORTED') {
              errorMessage = 'Request timed out. Retrying...';
            }
            setError(errorMessage);
            logEvent(analytics, 'checkout_status_polling_error', {
              nationalId,
              reference,
              trackingNumber,
              error: err.message,
              statusCode: err.response?.status,
            });
          }
        }
      }
    };

    const intervalId = setInterval(pollStatus, 10000);
    return () => clearInterval(intervalId);
  }, [reference, status, nationalId, trackingNumber]);

  // Handle invalid state
  if (!loanAmount || !trackingNumber || !reference || !phoneNumber) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Card sx={{ boxShadow: 6, borderRadius: 2 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <FontAwesomeIcon
              icon={faExclamationCircle}
              style={{ fontSize: '60px', color: '#d32f2f', mb: 2 }}
              aria-label="Error icon"
            />
            <Typography
              variant="h6"
              sx={{ color: 'error.main', mb: 2 }}
            >
              Invalid Loan Details
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Please try again or contact support.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ px: 4, py: 1.5 }}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: { xs: 2, sm: 0 } }}>
      <Card
        sx={{
          boxShadow: 6,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {/* Success Icon with Animation */}
          <Fade in timeout={1000}>
            <Box sx={{ mb: 3 }}>
              <FontAwesomeIcon
                icon={faCheckCircle}
                style={{ fontSize: '80px', color: '#4caf50' }}
                aria-label="Success checkmark"
              />
            </Box>
          </Fade>

          {/* Title */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2,
            }}
          >
            Loan Request Submitted
          </Typography>

          {/* Pending Message */}
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', mb: 3, fontStyle: 'italic' }}
          >
            Your loan is being processed. Funds will be disbursed to{' '}
            <strong>{phoneNumber}</strong> in less than 2 hours.
          </Typography>

          {/* Transaction Status */}
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color:
                status === 'QUEUED'
                  ? 'info.main'
                  : status === 'SUCCESS'
                  ? 'success.main'
                  : 'error.main',
              fontWeight: 'medium',
            }}
          >
            Transaction Status: <strong>{status}</strong>
            {status === 'QUEUED' && ' - Awaiting confirmation...'}
            {status === 'SUCCESS' && ' - Loan disbursed successfully!'}
            {(status === 'FAILED' || status === 'CANCELLED') &&
              ' - Please try again or contact support.'}
          </Typography>

          {/* Loan Details */}
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              backgroundColor: 'grey.50',
              transition: 'box-shadow 0.3s',
              '&:hover': {
                boxShadow: 2,
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}
            >
              Loan Details
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loan Amount:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                KES {loanAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Service Fee:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                KES {serviceFee.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Amount to Receive:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                KES {(loanAmount - serviceFee).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Phone Number:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {phoneNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tracking Number:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {trackingNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Transaction Reference:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {reference}
              </Typography>
            </Box>
          </Box>

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}
        </CardContent>

        {/* Actions */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/', { state: { nationalId, fullName } })}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 1,
            }}
            disabled={loading}
          >
            Back to Home
          </Button>
        </Box>
      </Card>

      {/* Success Modal */}
      <Dialog
        open={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          navigate('/', { state: { nationalId, fullName } });
        }}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2, p: 2 } }}
      >
        <DialogContent sx={{ textAlign: 'center' }}>
          <FontAwesomeIcon
            icon={faCheckCircle}
            style={{ fontSize: '60px', color: '#4caf50', mb: 2 }}
            aria-label="Success checkmark"
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Loan Disbursed Successfully!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Your loan of KES {(loanAmount - serviceFee).toLocaleString()} has been disbursed to{' '}
            <strong>{phoneNumber}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/', { state: { nationalId, fullName } })}
            sx={{ px: 4, py: 1 }}
          >
            Go to Home
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Modal */}
      <Dialog
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2, p: 2 } }}
      >
        <DialogContent sx={{ textAlign: 'center' }}>
          <FontAwesomeIcon
            icon={faExclamationCircle}
            style={{ fontSize: '60px', color: '#d32f2f', mb: 2 }}
            aria-label="Error icon"
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Transaction Error
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {error}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setErrorModalOpen(false);
              setError('');
              setStatus('QUEUED'); // Retry polling
            }}
            sx={{ px: 4, py: 1 }}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/', { state: { nationalId, fullName } })}
            sx={{ px: 4, py: 1 }}
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Checkout;