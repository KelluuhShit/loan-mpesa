import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Link,
  IconButton,
} from '@mui/material';
import { Phone, Email, Facebook, Twitter, Instagram } from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '70vh',
          width: '100%',
          backgroundImage: 'url(https://digitalbankingnews.co.ke/wp-content/uploads/2024/06/128698_web.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            py: { xs: 4, md: 8 },
          }}
        >
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
            }}
          >
            Welcome to Kopa Mobile to M-PESA
          </Typography>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: 'white',
              fontSize: { xs: '1rem', md: '1.3rem' },
              mb: 4,
            }}
          >
            Access instant loans with seamless M-PESA integration. Start by checking your eligibility today!
          </Typography>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              color: 'accent.main', // #EF9651
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.8rem' },
            }}
          >
            Get up to KES 20,000+ on your first application!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/eligibility')}
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              borderRadius: 12,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Check Eligibility
          </Button>
        </Container>
      </Box>

      {/* Services Section */}
      <Box id="services" sx={{ py: { xs: 4, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
            Our Services
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ mb: 2, color: 'primary.main' }}>
                  Instant Loans
                </Typography>
                <Typography variant="body1">
                  Get quick access to funds directly to your M-PESA account with zero paperwork.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ mb: 2, color: 'primary.main' }}>
                  Seamless M-PESA Integration
                </Typography>
                <Typography variant="body1">
                  Enjoy hassle-free loan disbursements and repayments via M-PESA.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ mb: 2, color: 'primary.main' }}>
                  Easy Eligibility Check
                </Typography>
                <Typography variant="body1">
                  Verify your loan eligibility in minutes with our simple online process.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" sx={{ py: { xs: 4, md: 8 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
            About Us
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ maxWidth: 800, mx: 'auto', fontSize: { xs: '1rem', md: '1.2rem' } }}
          >
            Kopa-Mobile-to-Mpesa is dedicated to providing fast, secure, and convenient loan services to Kenyans. Our mission is to empower you with financial solutions that are accessible anytime, anywhere, through seamless M-PESA integration.
          </Typography>
        </Container>
      </Box>

      {/* Contact Section (Footer) */}
      <Box
        id="contact"
        component="footer"
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1 }} />
                <Typography variant="body1">+254 700 123 456</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <Link href="mailto:support@kopa-to-mpesa.com" color="inherit">
                    support@kopa-to-mpesa.com
                  </Link>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Follow Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton href="https://facebook.com" color="inherit">
                  <Facebook />
                </IconButton>
                <IconButton href="https://twitter.com" color="inherit">
                  <Twitter />
                </IconButton>
                <IconButton href="https://instagram.com" color="inherit">
                  <Instagram />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}
          >
            © {new Date().getFullYear()} Kopa Mobile to M-PESA. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;