import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Eligibility from './pages/Eligibility';
import Borrow from './pages/Borrow';
import Checkout from './pages/Checkout';
import LoanProgress from './pages/LoanProgress';
import theme from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/loan-progress" element={<LoanProgress />} />
          <Route path="/borrow" element={<Borrow />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;