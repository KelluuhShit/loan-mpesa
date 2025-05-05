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
} from '@mui/material';
import { db, analytics, logEvent } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

function Borrow() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const limit = state?.limit || 0;
  const nationalId = state?.nationalId || '';
  const [userData, setUserData] = useState({ fullName: '', nationalId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Filter loans based on user's limit
  const eligibleLoans = loanAmounts.filter((loan) => loan.amount <= limit);

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
  const handleApply = (loanAmount) => {
    const trackingNumber = uuidv4().slice(0, 8);
    logEvent(analytics, 'borrow_loan_apply', {
      nationalId,
      loanAmount,
      trackingNumber,
    });
    navigate('/loan-application', {
      state: {
        loanAmount,
        nationalId,
        fullName: userData.fullName,
        trackingNumber,
      },
    });
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography
        variant="h1"
        gutterBottom
        sx={{
          fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
          textAlign: 'center',
          fontWeight: 'bold',
          color: 'primary.main',
        }}
      >
        Available Loan Options
      </Typography>
      <Typography
        variant="body1"
        sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}
      >
        Your loan limit: KES {limit.toLocaleString()}
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {eligibleLoans.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">No loan options available for your limit.</Alert>
          </Grid>
        ) : (
          eligibleLoans.map((loan) => (
            <Grid item xs={12} sm={6} md={4} key={loan.amount}>
              <Card
                sx={{
                  width: '100%', // 80% width within Grid item
                  mx: 'auto', // Center the card
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
                    <strong>Loan Tracking Number:</strong> {uuidv4().slice(0, 8)}
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
                    onClick={() => handleApply(loan.amount)}
                    aria-label={`Get KES ${loan.amount} loan`}
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
                    }}
                  >
                    Get Loan Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}

export default Borrow;