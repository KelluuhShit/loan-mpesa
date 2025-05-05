import axios from 'axios';

const API_BASE_URL = 'https://tengeneza-pesa.vercel.app/api';

// Initiates an STK Push payment
export const initiateSTKPush = async ({ phoneNumber, amount, reference }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}`,
      { phoneNumber, amount, reference },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to initiate STK Push');
  }
};

// Checks transaction status by reference
export const checkTransactionStatus = async (reference) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/transaction-status`,
      {
        params: { reference },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to check transaction status');
  }
};

// Client-side eligibility check (mock, replace with real endpoint if provided)
export const checkEligibility = async ({ name, idNumber, phoneNumber }) => {
  if (!name || !idNumber || !phoneNumber) {
    throw new Error('All fields are required');
  }
  if (!/^(254[17]\d{8}|0[17]\d{8})$/.test(phoneNumber)) {
    throw new Error('Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX');
  }
  if (!/^\d{8}$/.test(idNumber)) {
    throw new Error('ID number must be 8 digits');
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        eligible: true,
        limit: 5000, // KSh 5,000
        message: 'You are eligible for a loan up to KSh 5,000!',
      });
    }, 1000);
  });
};