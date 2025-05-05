import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#43a047',
      light: '#66A07A',
      dark: '#2A563A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EC5228',
      light: '#F27956',
      dark: '#C83A1B',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#EFEFEF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
    accent: {
      main: '#EF9651',
      dark: '#D87E3F',
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
    h1: { fontWeight: 700, fontSize: '1.8rem' },
    h2: { fontWeight: 700, fontSize: '1.5rem' },
    h3: { fontWeight: 500, fontSize: '1.2rem' },
    body1: { fontWeight: 400, fontSize: '0.9rem' },
    button: { fontWeight: 500, fontSize: '0.9rem', textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 20px',
          minWidth: '120px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          margin: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
        },
      },
    },
  },
});

export default theme;