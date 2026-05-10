import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Mail, RotateCw, Loader2, Check, X } from 'lucide-react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_BACKEND_URL + '/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  .auth-root { font-family: 'DM Sans', sans-serif; }
  .auth-serif { font-family: 'Playfair Display', serif; }

  @keyframes auth-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .auth-form-card {
    background: #fff;
    border: 1px solid #E2E4DE;
    border-radius: 24px;
    padding: 38px 34px;
    box-shadow: 0 25px 50px -12px rgba(46,79,79,.12);
    width: 100%;
    max-width: 420px;
    animation: auth-fadeUp .5s ease;
  }

  .auth-input {
    background: #F9FAF9;
    border: 1.5px solid #E2E4DE;
    border-radius: 12px;
    padding: 12px 16px;
    transition: border-color .2s, box-shadow .2s;
  }
  .auth-input:focus {
    border-color: #2E4F4F;
    box-shadow: 0 0 0 3px rgba(46,79,79,.08);
    outline: none;
  }

  .auth-btn-primary {
    width: 100%;
    background: #FF6B35;
    color: #fff;
    padding: 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
    transition: background .2s, transform .2s;
    border: none;
    cursor: pointer;
  }
  .auth-btn-primary:hover { background: #e85c26; transform: translateY(-1px); }

  .auth-image-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(46,79,79,.7) 0%, rgba(26,51,51,.8) 100%);
  }

  .auth-mobile-header { display: none; }
  @media (max-width: 1024px) { .auth-mobile-header { display: block; } }
`;

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { register } = useAuth();
  const [resending, setResending] = useState(false);

  /* ── Password validation ──────────────────────────────────────── */
  const passwordChecks = useMemo(() => {
    if (!password) return null;
    return {
      length: password.length >= 8,
      hasLetter: /[A-Za-z]/.test(password),
      hasDigit: /[0-9]/.test(password),
    };
  }, [password]);

  const passwordValid = passwordChecks
    ? passwordChecks.length && passwordChecks.hasLetter && passwordChecks.hasDigit
    : false;

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Za-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  }, [password]);

  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  /* ── Email validation ─────────────────────────────────────────── */
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ── Form validity ────────────────────────────────────────────── */
  const formValid = name.trim().length > 0 && emailValid && passwordValid;

  /* handlers unchanged */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      setVerificationSent(true);
      toast.success('Account created! Check your email to verify.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
  setResending(true);
  try {
    await axios.post(`${API_URL}/auth/resend-verification`, { email });
    toast.success('Verification email resent. Check your inbox.');
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Could not resend. Try again later.');
  } finally {
    setResending(false);
  }
};

  return (
    <div className="auth-root min-h-screen flex flex-col lg:flex-row overflow-hidden" data-testid="register-page">
      <style>{STYLES}</style>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden auth-left">
        <img
          src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDF8fHdvcmtzaG9wJTIwc3BlYWtpbmd8ZW58MHx8fHwxNjg1NzYxMjE2&ixlib=rb-4.0.3&q=80&w=1080"
          alt="Professional workshop setting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="auth-image-overlay" />
        <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14 text-white">
          <Link to="/" className="inline-block mb-8">
            <span className="text-2xl auth-serif font-light tracking-tight">ORATO</span>
          </Link>
          <blockquote className="auth-serif text-xl xl:text-2xl font-light italic leading-relaxed mb-4">
            "Communication is a skill that you can learn. It's like riding a bicycle or typing."
          </blockquote>
          <p className="text-sm opacity-75 max-w-xs">
            Start your journey to becoming a more confident, articulate speaker.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-[#F8FAF8]">
        {verificationSent ? (
          /* Success message — no navigation */
          <div className="auth-form-card flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="auth-serif text-2xl font-light">Check your email</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              We sent a verification link to <strong>{email}</strong>.
              Click the link to activate your account, then log in.
            </p>
            {/* Resend button */}
            <button
              onClick={resendVerification}
              disabled={resending}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: '#FF6B35' }}
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin" />   // make sure Loader2 is imported
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              {resending ? 'Resending...' : 'Resend verification email'}
            </button>
            <Link
              to="/login"
              className="inline-block mt-4 font-medium text-sm"
              style={{ color: '#FF6B35' }}
            >
              Go to Login
            </Link>
          </div>
        ) : (
          /* Registration form */
          <div className="auth-form-card">
            <div className="auth-mobile-header text-center mb-8">
              <Link to="/" className="inline-block mb-3">
                <span className="text-2xl auth-serif font-light tracking-tight text-primary">ORATO</span>
              </Link>
            </div>

            <div className="space-y-1.5 mb-6">
              <h2 className="auth-serif text-2xl font-light tracking-tight">Create account</h2>
              <p className="text-sm text-muted-foreground">Start your communication training journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  data-testid="register-name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required  
                  autoComplete="name"
                  className="auth-input"
                />
              </div>

              {/* Email with validation check */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  data-testid="register-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={`auth-input pr-10 ${email.length > 0 && (emailValid ? 'border-green-500 focus:border-green-500 focus:shadow-green-100' : 'border-red-400 focus:border-red-400 focus:shadow-red-100')}`}
                />
                {email.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValid ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                  </span>
                )}
              </div>
              {email.length > 0 && !emailValid && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
              )}
            </div>

            {/* Password with strength meter and checks */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                data-testid="register-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={`auth-input ${password.length > 0 && (passwordValid ? 'border-green-500' : 'border-gray-300')}`}
              />
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {/* Strength bar */}
                  <div className="flex gap-1">
                    {[0,1,2,3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{
                          background: i < passwordStrength ? strengthColors[passwordStrength-1] : '#E2E4DE',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColors[passwordStrength-1] }}>
                    Password strength: {strengthLabels[passwordStrength-1] || 'Too weak'}
                  </p>

                  {/* Requirement checkmarks */}
                  <ul className="space-y-1 mt-2">
                    <li className="flex items-center gap-2 text-xs">
                      {passwordChecks?.length ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-400" />}
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      {passwordChecks?.hasLetter ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-400" />}
                      Contains a letter
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      {passwordChecks?.hasDigit ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-400" />}
                      Contains a number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              data-testid="register-submit-btn"
              type="submit"
              disabled={!formValid || loading}
              className={`auth-btn-primary flex items-center justify-center gap-2 ${
                !formValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

            <div className="text-center text-sm mt-5 text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium" style={{ color: '#FF6B35' }} data-testid="register-login-link">
                Log in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};