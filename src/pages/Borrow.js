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
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { db, analytics, logEvent } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

  // Available loan amounts with service fees
  const loanAmounts = [
    { amount: 3000, serviceFee: 150 },
    { amount: 6000, serviceFee: 200 },
    { amount: 9000, serviceFee: 250 },
    { amount: 12000, serviceFee: 300 },
    { amount: 15000, serviceFee: 350 },
    { amount: 21000, serviceFee: 400 },
    { amount: 27000, serviceFee: 450 },
  ];

  // Filter loans based on user's limit and assign tracking numbers
  const eligibleLoans = loanAmounts
    .filter((loan) => loan.amount <= limit)
    .map((loan) => ({
      ...loan,
      trackingNumber: uuidv4().slice(0, 8),
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
          setUserData({
            fullName: userDoc.fullName || 'Unknown',
            nationalId: userDoc.nationalId || nationalId,
            phoneNumber: userDoc.phoneNumber || 'Not available',
          });
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
      setSelectedLoan(
        eligibleLoans.find((loan) => loan.amount === loanAmount && loan.trackingNumber === trackingNumber)
      );
      setModalOpen(true);
      logEvent(analytics, 'borrow_loan_modal_open', {
        nationalId,
        loanAmount,
        trackingNumber,
      });
    }, 2000);
  };

  // Handle modal continue
  const handleModalContinue = () => {
    if (selectedLoan) {
      logEvent(analytics, 'borrow_loan_modal_continue', {
        nationalId,
        loanAmount: selectedLoan.amount,
        trackingNumber: selectedLoan.trackingNumber,
      });
      navigate('/loan-application', {
        state: {
          loanAmount: selectedLoan.amount,
          nationalId,
          fullName: userData.fullName,
          trackingNumber: selectedLoan.trackingNumber,
        },
      });
    }
    setModalOpen(false);
    setSelectedLoan(null);
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
        sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}
      >
        Your loan limit: KES {limit.toLocaleString()}
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
            <Grid item xs={12} sm={6} md={4} key={loan.amount}>
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
          >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ fontSize: '60px', color: '#4caf50' }} // Green color matching success.main
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
                <strong>Recipient Mobile:</strong> {userData.phoneNumber}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 2, fontWeight: 'medium', display: 'flex', justifyContent: 'space-between' }}
              >
                <strong>Service Fee:</strong> KES {selectedLoan?.serviceFee.toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', textAlign: 'center', fontStyle: 'italic' }}
              >
                Your service fee will be withdrawable exclusively upon successful completion of your
                first loan repayment cycle.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleModalCancel}
            sx={{ px: 4, py: 1, textTransform: 'none' }}
            aria-label="Cancel loan application"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleModalContinue}
            sx={{ px: 4, py: 1, textTransform: 'none' }}
            aria-label="Continue to loan application"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Borrow;