import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import { updateUserProfile } from '../../utils/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserRole } from '../../utils/firestore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import './Login.css';
import logo from '../../assets/logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tncOpen, setTncOpen] = useState(false);
  const [tncChecked, setTncChecked] = useState(false);
  const [tncAccepted, setTncAccepted] = useState(false);
  const [tncScrolledToBottom, setTncScrolledToBottom] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role
      const role = await getUserRole(user.uid);
      // Record T&C acceptance if needed
      if (tncAccepted) {
        // try to persist on the user document
        recordTncAcceptance(user.uid);
      }

      // Redirect based on role
      if (role === 'superadmin') {
        navigate('/superadmin/users');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accepted = localStorage.getItem('vervex_tnc_accepted');
    if (accepted === 'true') {
      setTncAccepted(true);
    } else {
      // show T&C on first visit
      setTncOpen(true);
    }
  }, []);

  const handleAccept = () => {
    setTncChecked(true);
    setTncAccepted(true);
    localStorage.setItem('vervex_tnc_accepted', 'true');
    setTncOpen(false);
  };

  const handleOpenTnc = () => setTncOpen(true);

  // record acceptance after successful login
  const recordTncAcceptance = async (uid) => {
    try {
      await updateUserProfile(uid, {
        tncAccepted: true,
        tncAcceptedAt: serverTimestamp(),
        tncUserAgent: navigator.userAgent,
      });
    } catch (err) {
      // non-blocking: log and continue
      console.error('Failed to record T&C acceptance:', err);
    }
  };

  return (
    <Box className="login-bg">
      <Container component="main" maxWidth="sm">

        <Box className="login-container">
          {/* Main Card */}
          <Paper elevation={0} className="login-paper">
            {/* Header with Logo (moved inside card) */}
            <Box className="login-header">
              <img src={logo} alt="Vervex Logo" className="login-logo-img" />
              <Typography variant="subtitle1" className="luxury-tagline">
                Exclusive Access
              </Typography>
              {/* Centered Divider below tagline */}
              <Box className="gold-divider gold-divider-header" />
            </Box>

            <Dialog open={tncOpen} onClose={() => {}} fullWidth maxWidth="md">
              <DialogTitle sx={{ m: 0, p: 2 }}>
                Terms & Conditions
                <IconButton
                  aria-label="close"
                  onClick={() => setTncOpen(false)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto' }} onScroll={(e) => {
                const el = e.target;
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + 8) {
                  setTncScrolledToBottom(true);
                }
              }}>
                <Typography variant="body2" paragraph>
                  This is to certify that I am voluntarily joining VERVEX WORLDWIDE INC. To buy, sell and distribute its products, I have understood and agreed upon the terms and conditions of the Business Distributorship stated at the bottom hereof and any erasures/alterations will void this application.
                </Typography>
                <Typography variant="body2" paragraph>
                  1. I hereby submit my Distributor Application and Agreement form to become an Independent Distributor, herein referred to as Distributor of VERVEX WORLDWIDE INC. (hereinafter referred to as Company) I am now applying to become a participating member of the system in order to start availing the aforementioned benefits and services.
                </Typography>
                <Typography variant="body2" paragraph>
                  2. Signing this application means that I approve to become a Distributor of the company and that this agreement become effective on the date of acceptance by the company, either through original hard copy, facsimile or email of scanned copy of this agreement for me to be officially considered as a VERVEX WORLDWIDE INC. distributor, if the company does not receive this form, I understand that this Agreement will be cancelled. I also agree that my signature on the facsimile transmittal or emailed scanned copy be accepted by the company as my original signature. Application must include both front and back of this agreement.
                </Typography>
                <Typography variant="body2" paragraph>
                  3. As a Distributor of the company, I am privileged to participate in the sales and distributions of the company's goods, receive bonuses and commissions in accordance with the company compensation plan.
                </Typography>
                <Typography variant="body2" paragraph>
                  4. As a Distributor of the company, l am therefore an independent contractor; not an agent nor an employee, neither a franchisee of the company. I am fully aware that no employee-employer relationship exists between me and the company. I understand and fully agree that I will pay all income taxes, local taxes, and/or local license fees that may arise as a result of my undertakings under this agreement.
                </Typography>
                <Typography variant="body2" paragraph>
                  5. As a distributor, I will do my best to observe proper conduct and maintain ethical standards of the highest quality in the conduct of my VERVEX WORLDWIDE INC. business. The company has the right to terminate the contract Agreement of any Business Distributor who will be involved in any misconduct and/or harmful activity against the company.
                </Typography>
                <Typography variant="body2" paragraph>
                  6. I agree that i am not guaranteed of any commissions/bonuses, nor I am assured of any profit or success. I am free to set my own hours and determine my own area of territory of sales and methods of selling, within the parameters of this agreement. I also agree that i am responsible for my own expenses in relation to this distributorship.
                </Typography>
                <Typography variant="body2" paragraph>
                  7. I agree that this agreement does not include the sale of franchise, and that there are no exclusive territories granted to anyone.
                </Typography>
                <Typography variant="body2" paragraph>
                  8. I agree to indemnify and hold the company harmless from any claims, damages, and expenses indulging attorneys fees, arising out of my actions or conduct, and that of my employees and agents. This agreement is governed by the laws of the Republic of the Philippines.
                </Typography>
                <Typography variant="body2" paragraph>
                  9. With this agreement, the company has the right to change any marketing plans, principles, and policies if and when it is deemed necessary.
                </Typography>
                <Typography variant="body2" paragraph>
                  10. I shall be subject to sanction as specified in the policies and procedures of the company discretion for the violation or breach of any term or provision of the agreement. Upon the voluntary or involuntary cancellation of this agreement, I shall lose and expressly wave all rights, including property rights to my previous downline organization and to any bonuses, commissions or other compensation arising from sales generated by me or my prior downline organization.
                </Typography>
                <Typography variant="body2" paragraph>
                  11. The company shall be entitled to deduct and offset from any commissions, bonuses, or any other money payable to me, any amount past due and unpaid for purchases of the company products and services or any other money owed to the company by me.
                </Typography>
                <Typography variant="body2" paragraph>
                  12. The Distributor shall be solely and fully responsible and liable for any and all misrepresentations, non-compliant claims, unauthorized use of intellectual property, or use of language and testimonials that are not specifically approved and aligned with the Company's official standards and materials.
                </Typography>
                <Typography variant="body2" paragraph>
                  13. I acknowledged that I have read this agreement and agree to abide by and be bound by the terms contained here.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={tncChecked} disabled={!tncScrolledToBottom} onChange={(e) => setTncChecked(e.target.checked)} />}
                  label={tncScrolledToBottom ? "I have read and agree to the Terms & Conditions" : "Scroll to the bottom to enable"}
                />
                <Button disabled={!tncChecked} onClick={handleAccept} variant="contained" sx={{ backgroundColor: '#d4af37', color: '#081014' }}>
                  Accept
                </Button>
              </DialogActions>
            </Dialog>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" className="error-alert">
                {error}
              </Alert>
            )}

            {/* Title */}
            <Typography component="h1" variant="h5" className="login-title">
              SIGN IN
            </Typography>

            <Typography variant="body2" className="login-subtitle">
              Welcome back to luxury
            </Typography>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                className="luxury-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon className="input-icon" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                className="luxury-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon className="input-icon" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((s) => !s)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        size="small"
                        sx={{ color: '#d4af37' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="luxury-button"
                disabled={loading || !tncAccepted}
              >
                {loading ? 'PROCESSING...' : 'SIGN IN'}
              </Button>
            </Box>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#a3a3a3' }}>
                By signing in you agree to our{' '}
                <Link component="button" onClick={handleOpenTnc} sx={{ color: '#d4af37' }}>Terms & Conditions</Link>
              </Typography>
            </Box>

            {/* Divider */}
            <Box className="gold-divider-bottom" />
          </Paper>

          {/* Footer */}
          <Typography variant="caption" className="luxury-footer">
            © 2026 VERVEX. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
