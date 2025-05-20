import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { db, analytics, logEvent } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

function Borrow() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const limit = state?.limit || 0;
  const nationalId = state?.nationalId || '';
  const [userData, setUserData] = useState({ fullName: '', nationalId: '', phoneNumber: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buttonLoading, setButtonLoading] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPhoneNumber, setModalPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [stkPushSent, setStkPushSent] = useState(false);
  const [stkPushReference, setStkPushReference] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [statusError, setStatusError] = useState('');

  // Available loan amounts with service fees
  const loanAmounts = [
    { amount: 3000, serviceFee: 150 },
    { amount: 5500, serviceFee: 200 },
    { amount: 11800, serviceFee: 250 },
    { amount: 14200, serviceFee: 300 },
    { amount: 17400, serviceFee: 350 },
    { amount: 20500, serviceFee: 400 },
    { amount: 23070, serviceFee: 450 },
  ];

  // Filter loans based on user's limit and assign tracking numbers
  const eligibleLoans = loanAmounts
    .filter((loan) => loan.amount <= limit)
    .map((loan) => ({
      ...loan,
      trackingNumber: uuidv4(),
    }));

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!nationalId || typeof nationalId !== 'string' || nationalId.trim() === '') {
        setError('Invalid or missing National ID.');
        logEvent(analytics, 'borrow_fetch_error', {
          error: 'Invalid or missing nationalId',
          nationalId: nationalId || 'none',
        });
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'eligibilitySubmissions'),
          where('nationalId', '==', nationalId.trim())
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError('No user data found for the provided National ID.');
          logEvent(analytics, 'borrow_fetch_error', {
            error: 'No data found',
            nationalId,
          });
        } else {
          const userDoc = querySnapshot.docs[0].data();
          const phone = userDoc.phoneNumber || 'Not available';
          setUserData({
            fullName: userDoc.fullName || 'Unknown',
            nationalId: userDoc.nationalId || nationalId,
            phoneNumber: phone,
          });
          setModalPhoneNumber(phone === 'Not available' ? '' : phone);
          logEvent(analytics, 'borrow_fetch_success', {
            nationalId,
          });
        }
      } catch (err) {
        let errorMessage = 'Failed to fetch user data. Please try again.';
        if (err.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please check Firestore rules or contact support.';
        }
        setError(errorMessage);
        logEvent(analytics, 'borrow_fetch_error', {
          error: err.message,
          code: err.code || 'unknown',
          nationalId,
        });
        console.error('Firestore error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [nationalId]);

  // Polling for transaction status
  useEffect(() => {
    if (!stkPushSent || !stkPushReference || !modalOpen) return;

    const startTime = Date.now();
    const maxPollingDuration = 300000; // 5 minutes

    const pollStatus = async () => {
      if (Date.now() - startTime > maxPollingDuration) {
        setStatusError('Transaction timed out. Please try again.');
        setStkPushSent(false);
        console.log('Polling stopped due to timeout');
        logEvent(analytics, 'borrow_polling_timeout', {
          nationalId,
          reference: stkPushReference,
        });
        return;
      }

      try {
        const apiUrl = process.env.NODE_ENV === 'production'
          ? process.env.REACT_APP_API_URL || 'https://kopa-mobile-to-mpesa.vercel.app'
          : 'https://kopa-mobile-to-mpesa.vercel.app';
        console.log(`Polling status for PayHero reference: ${stkPushReference}`);
        const response = await axios.get(`${apiUrl}/api/transaction-status?reference=${stkPushReference}`, {
          timeout: 20000,
        });

        console.log(`Status response:`, response.data);
        if (response.data.success) {
          const status = response.data.status;
          setTransactionStatus(status);
          logEvent(analytics, 'borrow_transaction_status', {
            nationalId,
            reference: stkPushReference,
            status,
          });

          if (status === 'SUCCESS') {
            navigate('/checkout', {
              state: {
                loanAmount: selectedLoan.amount,
                nationalId,
                fullName: userData.fullName,
                trackingNumber: selectedLoan.trackingNumber,
                reference: stkPushReference,
                serviceFee: selectedLoan.serviceFee,
              },
            });
            setModalOpen(false);
          } else if (status === 'FAILED' || status === 'CANCELLED') {
            setStatusError('Transaction failed or was cancelled. Please try again.');
          }
        } else {
          setStatusError('Failed to check transaction status. Please try again.');
        }
      } catch (err) {
        console.error('Status polling error:', err);
        let errorMessage = 'Error checking transaction status. Retrying...';
        if (err.response?.status === 404) {
          setTransactionStatus('QUEUED');
          errorMessage = 'Transaction is being processed. Please wait...';
        } else if (err.response?.status === 400) {
          errorMessage = 'Invalid transaction reference. Please try again.';
        }
        setStatusError(errorMessage);
        logEvent(analytics, 'borrow_status_polling_error', {
          nationalId,
          reference: stkPushReference,
          error: err.message,
          statusCode: err.response?.status,
        });
      }
    };

    const intervalId = setInterval(pollStatus, 5000);
    return () => clearInterval(intervalId);
  }, [stkPushSent, stkPushReference, modalOpen, nationalId, selectedLoan, navigate, userData]);

  // Handle loan application
  const handleApply = (loanAmount, trackingNumber) => {
    setButtonLoading((prev) => ({ ...prev, [loanAmount]: true }));
    logEvent(analytics, 'borrow_loan_apply_click', {
      nationalId,
      loanAmount,
      trackingNumber,
    });

    setTimeout(() => {
      setButtonLoading((prev) => ({ ...prev, [loanAmount]: false }));
      const selected = eligibleLoans.find(
        (loan) => loan.amount === loanAmount && loan.trackingNumber === trackingNumber
      );
      setSelectedLoan(selected);
      setModalPhoneNumber(userData.phoneNumber === 'Not available' ? '' : userData.phoneNumber);
      setModalOpen(true);
      setStkPushSent(false);
      setTransactionStatus('');
      setStatusError('');
      logEvent(analytics, 'borrow_loan_modal_open', {
        nationalId,
        loanAmount,
        trackingNumber,
      });
    }, 2000);
  };

  // Validate phone number input
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      return 'Phone number is required';
    }
    let formattedPhone = phone;
    if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.slice(1)}`;
    }
    if (!/^(254[17]\d{8})$/.test(formattedPhone)) {
      return 'Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX';
    }
    return '';
  };

  // Handle phone number change
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setModalPhoneNumber(phone);
    setPhoneError(validatePhoneNumber(phone));
    logEvent(analytics, 'borrow_phone_number_edit', {
      nationalId,
      phoneNumber: phone,
    });
  };

  // Handle modal continue (STK Push)
  const handleModalContinue = async () => {
    if (!selectedLoan) return;

    const phoneValidationError = validatePhoneNumber(modalPhoneNumber);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    setConfirmLoading(true);
    setModalError('');
    logEvent(analytics, 'borrow_loan_modal_continue', {
      nationalId,
      loanAmount: selectedLoan.amount,
      trackingNumber: selectedLoan.trackingNumber,
    });

    try {
      let formattedPhone = modalPhoneNumber;
      if (formattedPhone.startsWith('+254')) {
        formattedPhone = formattedPhone.slice(1);
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = `254${formattedPhone.slice(1)}`;
      }

      const apiUrl = process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL || 'https://kopa-mobile-to-mpesa.vercel.app'
        : 'https://kopa-mobile-to-mpesa.vercel.app';

      console.log(`Sending STK Push - Phone: ${formattedPhone}, Amount: ${selectedLoan.serviceFee}, Client Reference: ${selectedLoan.trackingNumber}`);

      const response = await axios.post(
        `${apiUrl}/api/stk-push`,
        {
          phoneNumber: formattedPhone,
          amount: selectedLoan.serviceFee,
          reference: selectedLoan.trackingNumber,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        setStkPushSent(true);
        setStkPushReference(response.data.payheroReference);
        logEvent(analytics, 'borrow_stk_push_success', {
          nationalId,
          loanAmount: selectedLoan.amount,
          serviceFee: selectedLoan.serviceFee,
          trackingNumber: selectedLoan.trackingNumber,
          payheroReference: response.data.payheroReference,
        });
      } else {
        throw new Error(response.data.error || 'STK Push initiation failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate payment. Please try again.';
      setModalError(errorMessage);
      logEvent(analytics, 'borrow_stk_push_error', {
        nationalId,
        loanAmount: selectedLoan.amount,
        serviceFee: selectedLoan.serviceFee,
        trackingNumber: selectedLoan.trackingNumber,
        error: errorMessage,
      });
      console.error('STK Push error:', err);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    logEvent(analytics, 'borrow_loan_modal_cancel', {
      nationalId,
      loanAmount: selectedLoan?.amount,
      trackingNumber: selectedLoan?.trackingNumber,
    });
    setModalOpen(false);
    setSelectedLoan(null);
    setModalError('');
    setPhoneError('');
    setModalPhoneNumber(userData.phoneNumber === 'Not available' ? '' : userData.phoneNumber);
    setStkPushSent(false);
    setStkPushReference('');
    setTransactionStatus('');
    setStatusError('');
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Render invalid limit
  if (!limit || limit <= 0) {
    logEvent(analytics, 'borrow_invalid_limit', {
      limit,
      nationalId,
    });
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="warning">Invalid or no loan limit provided.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 1 }}>
      <Typography
        variant="h1"
        gutterBottom
        sx={{
          fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
          textAlign: 'center',
          fontWeight: 'bold',
          color: 'primary.main',
        }}
        id="loan-options-title"
      >
        Available Loan Options
      </Typography>
      <Typography
        variant="body1"
        sx={{ textAlign: 'center', mb: 4, color: 'text.secondary', fontWeight: 'bold' }}
      >
        Dear customer, you qualify for a loan of up to KES {limit.toLocaleString()}. Please select your desired loan amount to complete your application.
      </Typography>
      <Grid
        container
        spacing={3}
        justifyContent="center"
        role="region"
        aria-labelledby="loan-options-title"
      >
        {eligibleLoans.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">No loan options available for your limit.</Alert>
          </Grid>
        ) : (
          eligibleLoans.map((loan) => (
            <Grid item xs={12} sm={6} md={4} key={loan.trackingNumber}>
              <Card
                sx={{
                  width: '100%',
                  mx: 'auto',
                  boxShadow: 3,
                  borderRadius: 2,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'background.paper',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    KES {loan.amount.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>Full Name:</strong> {userData.fullName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>National ID:</strong> {userData.nationalId}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>Loan Tracking Number:</strong> {loan.trackingNumber}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>Interest Rate:</strong> 7%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>Service Fee:</strong> KES {loan.serviceFee.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.primary', fontWeight: 'medium' }}
                  >
                    <strong>Repayment Period:</strong> 61 days
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleApply(loan.amount, loan.trackingNumber)}
                    aria-label={`Get KES ${loan.amount} loan`}
                    disabled={buttonLoading[loan.amount]}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: 1,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      minWidth: 150,
                    }}
                  >
                    {buttonLoading[loan.amount] ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Get Loan Now'
                    )}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Loan Confirmation Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleModalCancel}
        maxWidth="sm"
        fullWidth
        aria-labelledby="loan-confirmation-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            boxShadow: 6,
            backgroundColor: 'background.paper',
            p: 2,
          },
        }}
      >
        <DialogTitle
          id="loan-confirmation-title"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Loan Confirmation
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleModalCancel}
            sx={{ color: 'text.secondary' }}
            disabled={stkPushSent && transactionStatus !== 'FAILED' && transactionStatus !== 'CANCELLED'}
          >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {modalError}
            </Alert>
          )}
          {stkPushSent && !statusError && !transactionStatus && (
            <Alert severity="success" sx={{ mb: 2 }}>
              STK Push successfully sent to {modalPhoneNumber}. Please complete the payment on your phone.
            </Alert>
          )}
          {statusError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {statusError}
            </Alert>
          )}
          {transactionStatus === 'SUCCESS' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Transaction completed successfully! Redirecting...
            </Alert>
          )}
          {transactionStatus === 'QUEUED' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Transaction is being processed. Please complete the payment on your phone.
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ fontSize: '60px', color: '#4caf50' }}
              aria-label="Success checkmark"
            />
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="body1"
                sx={{ mb: 1, fontWeight: 'medium', display: 'flex', justifyContent: 'space-between' }}
              >
                <strong>Total Loan:</strong> KES {selectedLoan?.amount.toLocaleString()}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 1, fontWeight: 'medium', display: 'flex', justifyContent: 'space-between' }}
              >
                <strong>Loan Disbursable to M-PESA:</strong> KES{' '}
                {(selectedLoan?.amount - selectedLoan?.serviceFee).toLocaleString()}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 1, fontWeight: 'medium', display: 'flex', justifyContent: 'space-between' }}
              >
                <strong>Service Fee to Pay:</strong> KES {selectedLoan?.serviceFee.toLocaleString()}
              </Typography>
              <TextField
                label="Recipient Mobile Number"
                value={modalPhoneNumber}
                onChange={handlePhoneChange}
                fullWidth
                margin="normal"
                error={!!phoneError}
                helperText={phoneError}
                aria-label="Edit recipient mobile number"
                inputProps={{ maxLength: 12 }}
                disabled={stkPushSent}
              />
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', textAlign: 'center', fontStyle: 'italic', mt: 2 }}
              >
                Pay the service fee via M-PESA to receive your loan. The service fee is withdrawable
                upon successful completion of your first loan repayment cycle.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          {!stkPushSent || transactionStatus === 'FAILED' || transactionStatus === 'CANCELLED' ? (
            <>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleModalCancel}
                disabled={confirmLoading}
                sx={{ px: 4, py: 1, textTransform: 'none' }}
                aria-label="Cancel loan application"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleModalContinue}
                disabled={confirmLoading || !!phoneError}
                sx={{ px: 4, py: 1, textTransform: 'none' }}
                aria-label="Confirm loan application"
              >
                {confirmLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
              </Button>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Awaiting payment confirmation...
            </Typography>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Borrow;