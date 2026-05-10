import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail, RotateCw } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const calledOnce = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (calledOnce.current) return;   // ← stop duplicate calls
    calledOnce.current = true;

    axios
      .get(`${API_URL}/auth/verify-email`, { params: { token: token.trim() } })
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed. The link may be invalid or expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8] p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-10">
          <span className="text-2xl font-serif font-light tracking-tight text-primary"
            style={{ fontFamily: 'Playfair Display, serif' }}>ORATO</span>
        </Link>
        <div className="bg-white border border-[#E2E4DE] rounded-2xl p-8 text-center shadow-lg space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-14 h-14 animate-spin text-[#2E4F4F] mx-auto" />
              <h2 className="text-xl font-serif font-light">Verifying your email...</h2>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-serif font-light">Email Verified!</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link to="/login">
                <Button className="bg-[#FF6B35] hover:bg-[#e85c26] text-white w-full py-3 rounded-xl font-semibold">
                  Go to Login
                </Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-serif font-light">Verification Failed</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex flex-col gap-3 mt-4">
                <Link to="/register">
                  <Button variant="outline" className="w-full py-3 rounded-xl">
                    Back to Registration
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" className="w-full py-3 rounded-xl text-sm">
                    Try logging in anyway
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};