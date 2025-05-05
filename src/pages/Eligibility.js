import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Box,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { checkEligibility } from '../api/api';
import { analytics, logEvent, db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

function Eligibility() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    nationalId: '',
    gender: '',
    dateOfBirth: null,
    county: '',
    education: '',
    employment: '',
    income: '',
    loanPurpose: '',
  });

  const steps = ['Personal Details', 'Additional Details'];

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.fullName) newErrors.fullName = 'Full Name is required';
    if (!form.phoneNumber) {
      newErrors.phoneNumber = 'Phone Number is required';
    } else if (!/^07\d{8}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid phone number (e.g., 07XXXXXXXX)';
    }
    if (!form.nationalId) newErrors.nationalId = 'National ID Number is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    if (!form.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dob = new Date(form.dateOfBirth);
      dob.setHours(0, 0, 0, 0);
      if (dob >= today) {
        newErrors.dateOfBirth = 'Date of Birth must be before today';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.county) newErrors.county = 'County of Residence is required';
    if (!form.education) newErrors.education = 'Level of Education is required';
    if (!form.employment) newErrors.employment = 'Employment Status is required';
    if (!form.income) newErrors.income = 'Monthly Income is required';
    if (!form.loanPurpose) newErrors.loanPurpose = 'Loan Purpose is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) {
      logEvent(analytics, 'eligibility_step_1_completed', {
        idNumber: form.nationalId,
      });
      setActiveStep(1);
    } else if (activeStep === 1 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await checkEligibility({
        name: form.fullName,
        idNumber: form.nationalId,
        phoneNumber: form.phoneNumber,
      });
      const submissionData = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        nationalId: form.nationalId,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth ? format(new Date(form.dateOfBirth), 'yyyy-MM-dd') : null,
        county: form.county,
        education: form.education,
        employment: form.employment,
        income: form.income,
        loanPurpose: form.loanPurpose,
        eligible: response.eligible,
        limit: response.eligible ? response.limit : null,
        message: response.eligible ? null : response.message,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'eligibilitySubmissions'), submissionData);
      logEvent(analytics, 'eligibility_submission_stored', {
        status: response.eligible ? 'success' : 'failed',
        nationalId: form.nationalId,
      });

      setLoading(false);
      if (response.eligible) {
        logEvent(analytics, 'eligibility_check', {
          status: 'success',
          limit: response.limit,
        });
        navigate('/borrow', { state: { limit: response.limit } });
      } else {
        logEvent(analytics, 'eligibility_check', {
          status: 'failed',
          message: response.message,
        });
        setErrors({ submit: response.message });
      }
    } catch (error) {
      setLoading(false);
      logEvent(analytics, 'eligibility_check_error', {
        error: error.message,
      });
      setErrors({ submit: error.message });
    }
  };

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleDateChange = (date) => {
    setForm({ ...form, dateOfBirth: date });
    setErrors({ ...errors, dateOfBirth: '' });
  };

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
          Check Your Eligibility
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {errors.submit && (
          <Typography
            variant="body1"
            color="secondary"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            {errors.submit}
          </Typography>
        )}
        {activeStep === 0 && (
          <Box component="form" noValidate>
            <TextField
              fullWidth
              label="Full Name"
              value={form.fullName}
              onChange={handleChange('fullName')}
              variant="outlined"
              required
              error={!!errors.fullName}
              helperText={errors.fullName}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number (e.g., 07XXXXXXXX)"
              value={form.phoneNumber}
              onChange={handleChange('phoneNumber')}
              variant="outlined"
              required
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="National ID Number"
              value={form.nationalId}
              onChange={handleChange('nationalId')}
              variant="outlined"
              required
              error={!!errors.nationalId}
              helperText={errors.nationalId}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={form.gender}
                onChange={handleChange('gender')}
                label="Gender"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.gender && (
                <Typography variant="caption" color="error">
                  {errors.gender}
                </Typography>
              )}
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date of Birth"
                value={form.dateOfBirth}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth}
                    sx={{ mb: 2 }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>
        )}
        {activeStep === 1 && (
          <Box component="form" noValidate>
            <TextField
              fullWidth
              label="County of Residence"
              value={form.county}
              onChange={handleChange('county')}
              variant="outlined"
              required
              error={!!errors.county}
              helperText={errors.county}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.education}>
              <InputLabel>Level of Education</InputLabel>
              <Select
                value={form.education}
                onChange={handleChange('education')}
                label="Level of Education"
              >
                <MenuItem value="Primary">Primary</MenuItem>
                <MenuItem value="Secondary">Secondary</MenuItem>
                <MenuItem value="Tertiary">Tertiary</MenuItem>
              </Select>
              {errors.education && (
                <Typography variant="caption" color="error">
                  {errors.education}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.employment}>
              <InputLabel>Employment Status</InputLabel>
              <Select
                value={form.employment}
                onChange={handleChange('employment')}
                label="Employment Status"
              >
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="Unemployed">Unemployed</MenuItem>
                <MenuItem value="Employed">Employed</MenuItem>
                <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.employment && (
                <Typography variant="caption" color="error">
                  {errors.employment}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.income}>
              <InputLabel>Monthly Income (KES)</InputLabel>
              <Select
                value={form.income}
                onChange={handleChange('income')}
                label="Monthly Income (KES)"
              >
                <MenuItem value="10000-20000">10,000 - 20,000</MenuItem>
                <MenuItem value="20001-30000">20,001 - 30,000</MenuItem>
                <MenuItem value="30001-40000">30,001 - 40,000</MenuItem>
                <MenuItem value="40001-50000">40,001 - 50,000</MenuItem>
                <MenuItem value="50001-60000">50,001 - 60,000</MenuItem>
                <MenuItem value="60001-70000">60,001 - 70,000</MenuItem>
                <MenuItem value="70001-80000">70,001 - 80,000</MenuItem>
              </Select>
              {errors.income && (
                <Typography variant="caption" color="error">
                  {errors.income}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.loanPurpose}>
              <InputLabel>Loan Purpose</InputLabel>
              <Select
                value={form.loanPurpose}
                onChange={handleChange('loanPurpose')}
                label="Loan Purpose"
              >
                <MenuItem value="Personal">Personal</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.loanPurpose && (
                <Typography variant="caption" color="error">
                  {errors.loanPurpose}
                </Typography>
              )}
            </FormControl>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : activeStep === steps.length - 1 ? (
              'Submit'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default Eligibility;