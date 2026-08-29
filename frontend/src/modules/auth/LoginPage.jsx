import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle, ShieldCheck, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../shared/components/Button';
import api from '../../shared/api';

export default function LoginPage() {
  const [form, setForm]                   = useState({ email: '', password: '' });
  const [showPw, setShowPw]               = useState(false);
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [loading, setLoading]             = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep]           = useState(1); // 1: Email Request, 2: OTP & New Password
  const [resetEmail, setResetEmail]           = useState('');
  const [resetOtp, setResetOtp]               = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw]             = useState(false);
  const [forgotLoading, setForgotLoading]     = useState(false);
  const [forgotError, setForgotError]         = useState('');
  const [forgotMsg, setForgotMsg]             = useState('');
  const [resetDevOtp, setResetDevOtp]         = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Handlers ──
  const handleRequestResetOtp = async e => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setResetDevOtp('');
    if (!resetEmail || !resetEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: resetEmail });
      setForgotMsg(data.message || 'Verification code sent to your email.');
      if (data.devOtp) setResetDevOtp(data.devOtp);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Failed to send password reset code. Please verify your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSaveNewPassword = async e => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!resetOtp || resetOtp.length !== 6) {
      setForgotError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: resetEmail,
        otp: resetOtp,
        newPassword,
      });

      // Reset modal state & transfer email to login form
      setShowForgotModal(false);
      setForm(f => ({ ...f, email: resetEmail, password: '' }));
      setSuccessMsg(data.message || '🎉 Password reset successfully! Please sign in with your new password.');
      setForgotStep(1);
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setForgotError(err.response?.data?.error || 'Password reset failed. Please check your verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-accent-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">
            Place<span className="text-accent-blue">Mate</span> AI
          </h1>
          <p className="text-muted text-[13px] mt-1">Your personalized career companion</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-card shadow-card p-8">
          <h2 className="text-[17px] font-semibold text-text mb-6">Sign In</h2>

          {successMsg && (
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg px-4 py-2.5 text-[12px] text-accent-green mb-5 flex items-center gap-2">
              <CheckCircle size={15} /> {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg px-4 py-2.5 text-[12px] text-accent-red mb-5">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-[12px] font-medium text-muted">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-[12px] font-medium text-muted">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-10 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  id="login-toggle-pw"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Forgot password link below the password input section */}
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.email);
                    setForgotError('');
                    setForgotMsg('');
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                  className="text-[11.5px] font-semibold text-accent-blue hover:underline cursor-pointer"
                  id="forgot-password-trigger"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              id="login-submit"
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-[12px] text-muted mt-6">
            No account?{' '}
            <Link to="/signup" className="text-accent-blue hover:underline font-medium" id="login-to-signup">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ────────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-text transition-colors p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center font-bold">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-text">Reset Your Password</h3>
                <p className="text-[12px] text-muted">
                  {forgotStep === 1 ? 'Step 1: Verify your registered email address' : 'Step 2: Enter 6-digit code and create new password'}
                </p>
              </div>
            </div>

            {forgotMsg && (
              <div className="bg-accent-green/10 border border-accent-green/30 p-3 rounded-xl text-[12px] text-accent-green flex items-center gap-2">
                <CheckCircle size={15} /> {forgotMsg}
              </div>
            )}

            {forgotError && (
              <div className="bg-accent-red/10 border border-accent-red/30 p-3 rounded-xl text-[12px] text-accent-red">
                {forgotError}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetOtp} className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Registered Account Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      placeholder="Enter your registered email address"
                      className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
                      id="reset-email-input"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium text-muted hover:text-text"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={forgotLoading}
                    icon={forgotLoading ? Loader2 : Mail}
                    id="send-reset-otp-btn"
                  >
                    Send Reset Code
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                {resetDevOtp && (
                  <div className="bg-accent-blue/15 border border-accent-blue/40 rounded-xl p-2.5 text-center space-y-1">
                    <div className="text-[12px] font-semibold text-accent-blue flex items-center justify-center gap-1.5">
                      <ShieldCheck size={15} /> Dev Reset Code: <span className="font-mono text-[15px] tracking-widest font-bold text-white bg-accent-blue px-2 py-0.5 rounded">{resetDevOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetOtp(resetDevOtp)}
                      className="text-[11px] font-bold text-accent-blue hover:underline"
                    >
                      ⚡ Auto-fill code {resetDevOtp}
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">6-Digit Email Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetOtp}
                    onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="Enter 6-digit code"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-[16px] font-mono tracking-widest text-text text-center focus:outline-none focus:border-accent-blue"
                    id="reset-otp-input"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 8 characters"
                      className="w-full bg-surface border border-border rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                      id="new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                    >
                      {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                      id="confirm-password-input"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[12px] font-medium text-muted hover:text-text flex items-center gap-1"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={forgotLoading}
                    icon={forgotLoading ? Loader2 : ShieldCheck}
                    id="save-new-password-btn"
                  >
                    Save New Password
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
