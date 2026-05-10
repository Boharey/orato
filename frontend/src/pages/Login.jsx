import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  .auth-root { font-family: 'DM Sans', sans-serif; }
  .auth-serif { font-family: 'Playfair Display', serif; }

  @keyframes auth-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .auth-left {
    background: #1a2e1a; /* fallback */
  }
  .auth-image-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(46,79,79,.7) 0%, rgba(26,51,51,.8) 100%);
  }

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

  .auth-divider {
    height: 1px;
    background: #E2E4DE;
    margin: 28px 0;
  }

  .auth-mobile-header { display: none; }
  @media (max-width: 1024px) { .auth-mobile-header { display: block; } }
`;

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root min-h-screen flex flex-col lg:flex-row overflow-hidden" data-testid="login-page">
      <style>{STYLES}</style>

      {/* ── Left decorative panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden auth-left">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDEyfHxwdWJsaWMlMjBzcGVha2luZ3xlbnwwfHx8fDE2ODU3NjA0NTk&ixlib=rb-4.0.3&q=80&w=1080"
          alt="Professional speaker at an event"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="auth-image-overlay" />

        <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14 text-white">
          <Link to="/" className="inline-block mb-8">
            <span className="text-2xl auth-serif font-light tracking-tight">ORATO</span>
          </Link>

          <blockquote className="auth-serif text-xl xl:text-2xl font-light italic leading-relaxed mb-4">
            "The way we communicate with others and with ourselves ultimately determines the quality of our lives."
          </blockquote>

          <p className="text-sm opacity-75 max-w-xs">
            Join thousands of professionals improving their speaking every day.
          </p>

          <div className="auth-divider" />

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs opacity-60">
            <span className="flex items-center gap-1.5"><span>✓</span> No credit card</span>
            <span className="flex items-center gap-1.5"><span>✓</span> Free plan</span>
            <span className="flex items-center gap-1.5"><span>✓</span> Instant results</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-[#F8FAF8]">
        <div className="auth-form-card">
          {/* Mobile header */}
          <div className="auth-mobile-header text-center mb-8">
            <Link to="/" className="inline-block mb-3">
              <span className="text-2xl auth-serif font-light tracking-tight text-primary">ORATO</span>
            </Link>
          </div>

          <div className="space-y-1.5 mb-6">
            <h2 className="auth-serif text-2xl font-light tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Login to continue your training</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autocomplete="email"
                className="auth-input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autocomplete="current-password"
                className="auth-input"
              />
            </div>

            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="auth-btn-primary flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : <><LogIn className="w-4 h-4" /> Login</>}
            </button>
          </form>

          <div className="text-center text-sm mt-5 text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{color:'#FF6B35'}} data-testid="login-register-link">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};