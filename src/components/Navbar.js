import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { label: 'Home', path: '/', sectionId: null },
    { label: 'Service', path: '/', sectionId: 'services' },
    { label: 'About', path: '/', sectionId: 'about' },
    { label: 'Contact', path: '/', sectionId: 'contact' },
    { label: 'Check Eligibility', path: '/eligibility', sectionId: null, isButton: true },
  ];

  const handleNavClick = (path, sectionId) => {
    if (sectionId && location.pathname === '/') {
      // On home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionId) {
      // Navigate to home and scroll to section
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Delay to ensure page loads
    } else {
      // Navigate to path (e.g., Home, Apply Now)
      navigate(path);
    }
    setDrawerOpen(false); // Close drawer on mobile
  };

  const drawerContent = (
    <Box
      sx={{ width: 250, pt: 2 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => handleNavClick(item.path, item.sectionId)}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    fontWeight: item.isButton ? 700 : 500,
                    color: item.isButton ? 'accent.main' : 'text.primary',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
            fontFamily: '"Montserrat", sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          KOPA TO  M<Box
            component="img"
            src={require('../assets/navbg.png')}
            alt="M-PESA Logo"
            sx={{
              height: 28,
              width: 22,
              verticalAlign: 'middle',
              display: 'inline',
            }}
          />PESA
        </Typography>

        {/* Desktop: Nav Items, Mobile: Menu Icon */}
        {isMobile ? (
          <IconButton
            color="inherit"
            edge="end"
            onClick={toggleDrawer(true)}
            sx={{ ml: 'auto' }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {navItems.map((item) =>
              item.isButton ? (
                <Button
                  key={item.label}
                  variant="contained"
                  sx={{
                    mx: 1,
                    borderRadius: 12,
                    backgroundColor: 'accent.main',
                    color: 'primary.contrastText',
                    '&:hover': { backgroundColor: 'accent.dark' },
                  }}
                  onClick={() => handleNavClick(item.path, item.sectionId)}
                >
                  {item.label}
                </Button>
              ) : (
                <Button
                  key={item.label}
                  color="inherit"
                  onClick={() => handleNavClick(item.path, item.sectionId)}
                  sx={{ mx: 1 }}
                >
                  {item.label}
                </Button>
              )
            )}
          </Box>
        )}
      </Toolbar>

      {/* Drawer for Mobile */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>
    </AppBar>
  );
}

export default Navbar;