import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent, Slider, Typography } from '@mui/material';

function Borrow() {
  const { state } = useLocation();
  const { limit } = state || { limit: 5000 };
  const [loanAmount, setLoanAmount] = useState(limit / 2);
  const navigate = useNavigate();

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h1" gutterBottom>
          Select Loan Amount
        </Typography>
        <Typography variant="body1" gutterBottom>
          You are eligible for up to KSh {limit.toLocaleString()}.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Loan Amount: KSh {loanAmount.toLocaleString()}
        </Typography>
        <Slider
          value={loanAmount}
          onChange={(e, value) => setLoanAmount(value)}
          min={1000}
          max={limit}
          step={500}
          sx={{
            color: 'primary.main',
            '& .MuiSlider-thumb': {
              '&:hover': { backgroundColor: 'accent.main' },
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/checkout', { state: { loanAmount } })}
          fullWidth
          sx={{ mt: 2 }}
        >
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}

export default Borrow;