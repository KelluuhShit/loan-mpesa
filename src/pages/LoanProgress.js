import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { analytics, logEvent } from '../firebaseConfig';

function LoanProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber, nationalId } = location.state || {};
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLoanData = async () => {
      if (!phoneNumber || !nationalId) {
        setError('Invalid access. Please track your loan from the home page.');
        setLoading(false);
        logEvent(analytics, 'loan_progress_error', { error: 'Missing phoneNumber or nationalId' });
        return;
      }

      try {
        const loansRef = collection(db, 'loans');
        const q = query(
          loansRef,
          where('phoneNumber', '==', phoneNumber),
          where('nationalId', '==', nationalId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const loan = querySnapshot.docs[0].data();
          setLoanData(loan);
          logEvent(analytics, 'loan_progress_viewed', { phoneNumber, nationalId });
        } else {
          setError('No loan data found.');
          logEvent(analytics, 'loan_progress_not_found', { phoneNumber, nationalId });
        }
      } catch (err) {
        setError('An error occurred while fetching loan data.');
        logEvent(analytics, 'loan_progress_error', { error: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [phoneNumber, nationalId]);

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <CardContent>
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
            textAlign: 'center',
          }}
        >
          Loan Progress
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Phone Number:</strong> {phoneNumber}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>National ID:</strong> {nationalId}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Loan Amount:</strong> KES {loanData.amount?.toLocaleString() || 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Status:</strong> {loanData.status || 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Repayment Due:</strong> {loanData.repaymentDue ? new Date(loanData.repaymentDue.toDate()).toLocaleDateString() : 'N/A'}
            </Typography>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default LoanProgress;