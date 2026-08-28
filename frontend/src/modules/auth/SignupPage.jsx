import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  User,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Mail,
  Smartphone,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react';
import api from '../../shared/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../shared/components/Button';
import DropdownSelect from '../../shared/components/DropdownSelect';

const DAILY_HOURS = [1, 2, 3, 4, 5, 6, 8];

const ROLES = [
  {
    id: 'STUDENT',
    label: 'Student',
    desc: 'Currently pursuing a degree',
    icon: GraduationCap,
  },
  {
    id: 'FRESHER',
    label: 'Fresher',
    desc: 'Recently graduated, job seeking',
    icon: User,
  },
  {
    id: 'EXPERIENCED',
    label: 'Experienced Professional',
    desc: 'Have prior work experience',
    icon: Briefcase,
  },
];

const QUALIFICATIONS = [
  'BE',
  'BTech',
  'BSc',
  'BCA',
  'ME',
  'MTech',
  'MCA',
  'MSc',
  'Other',
];

const DEPARTMENTS = [
  'CSE',
  'IT',
  'AI&DS',
  'AIML',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil',
  'Other',
];

const DOMAINS = [
  'DSA',
  'Python',
  'Java',
  'JavaScript',
  'React',
  'Node.js',
  'Full Stack',
  'SQL',
  'Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Aptitude',
];

const LOCATIONS = [
  'Coimbatore (Tamil Nadu)',
  'Madurai (Tamil Nadu)',
  'Chennai (Tamil Nadu)',
  'Bengaluru (Karnataka)',
  'Hyderabad (Telangana)',
  'Pune (Maharashtra)',
  'Mumbai (Maharashtra)',
  'Delhi NCR (Delhi, Noida, Gurgaon, Ghaziabad)',
  'Salem (Tamil Nadu)',
  'Tiruchirappalli / Trichy (Tamil Nadu)',
  'Tirunelveli (Tamil Nadu)',
  'Erode (Tamil Nadu)',
  'Vellore (Tamil Nadu)',
  'Thanjavur (Tamil Nadu)',
  'Tiruppur (Tamil Nadu)',
  'Kanchipuram (Tamil Nadu)',
  'Nagercoil / Kanyakumari (Tamil Nadu)',
  'Tuticorin / Thoothukudi (Tamil Nadu)',
  'Dindigul (Tamil Nadu)',
  'Karur (Tamil Nadu)',
  'Kolkata (West Bengal)',
  'Ahmedabad / Gandhinagar (Gujarat)',
  'Kochi / Thiruvananthapuram (Kerala)',
  'Jaipur (Rajasthan)',
  'Chandigarh / Mohali (Punjab/Haryana)',
  'Lucknow (Uttar Pradesh)',
  'Indore (Madhya Pradesh)',
  'Bhubaneswar (Odisha)',
  'Patna (Bihar)',
  'Guwahati (Assam & North East)',
  'Visakhapatnam (Andhra Pradesh)',
  'Nagpur (Maharashtra)',
  'Dehradun (Uttarakhand)',
  'PAN India / Remote',
  'International / Overseas',
  'Other (Type Custom Location)',
];

const INSTITUTIONS = [
  'SNS College of Engineering (Coimbatore, TN)',
  'SNS College of Technology (Coimbatore, TN)',
  'Rathinam College of Arts and Science / Technology (Coimbatore, TN)',
  'PSG College of Technology (PSG Tech Coimbatore, TN)',
  'Coimbatore Institute of Technology (CIT Coimbatore, TN)',
  'Kumaraguru College of Technology (KCT Coimbatore, TN)',
  'Sri Krishna College of Engineering and Technology (SKCET Coimbatore, TN)',
  'Sri Krishna College of Technology (SKCT Coimbatore, TN)',
  'Sri Ramakrishna Engineering College (SREC Coimbatore, TN)',
  'Hindusthan College of Engineering and Technology (Coimbatore, TN)',
  'KPR Institute of Engineering and Technology (Coimbatore, TN)',
  'Government College of Technology (GCT Coimbatore, TN)',
  'Thiagarajar College of Engineering (TCE Madurai, TN)',
  'Madura College (Madurai, TN)',
  'KLN College of Engineering (Madurai, TN)',
  'Kongu Engineering College (Perundurai, Erode, TN)',
  'Sona College of Technology (Salem, TN)',
  'Bannari Amman Institute of Technology (BIT Sathyamangalam, TN)',
  'Mepco Schlenk Engineering College (Sivakasi, TN)',
  'National Engineering College (Kovilpatti, TN)',
  'Government College of Engineering (Salem / Tirunelveli / Bargur)',
  'College of Engineering Guindy (CEG Anna University, Chennai)',
  'Madras Institute of Technology (MIT Chromepet, Chennai)',
  'SSN College of Engineering (Sri Sivasubramaniya Nadar Chennai)',
  'Rajalakshmi Engineering College (REC Chennai, TN)',
  'St. Joseph’s College of Engineering (Chennai, TN)',
  'Sathyabama Institute of Science and Technology (Chennai, TN)',
  'Vel Tech Rangarajan Dr. Sagunthala R&D Institute (Chennai, TN)',
  'SASTRA Deemed University (Thanjavur, TN)',
  'VIT University (Vellore / Chennai / Bhopal / AP)',
  'SRM Institute of Science and Technology (Kattankulathur / Ramapuram)',
  'IIT Madras (Indian Institute of Technology Madras)',
  'IIT Bombay (Indian Institute of Technology Bombay)',
  'IIT Delhi (Indian Institute of Technology Delhi)',
  'IIT Kharagpur (Indian Institute of Technology Kharagpur)',
  'IIT Kanpur (Indian Institute of Technology Kanpur)',
  'IIT Roorkee (Indian Institute of Technology Roorkee)',
  'IIT Guwahati (Indian Institute of Technology Guwahati)',
  'IIT Hyderabad (Indian Institute of Technology Hyderabad)',
  'NIT Trichy (National Institute of Technology Tiruchirappalli)',
  'NIT Surathkal (National Institute of Technology Karnataka)',
  'NIT Warangal (National Institute of Technology Warangal)',
  'NIT Calicut (National Institute of Technology Calicut)',
  'IIIT Hyderabad / IIIT Bangalore / IIIT Trichy',
  'BITS Pilani (Pilani, Goa, Hyderabad)',
  'Anna University & Affiliated Colleges (TN)',
  'Visvesvaraya Technological University (VTU Belagavi & Affiliated Colleges, KA)',
  'Jawaharlal Nehru Technological University (JNTU TS/AP)',
  'Savitribai Phule Pune University (SPPU MH)',
  'Mumbai University & Affiliated Colleges (MH)',
  'Delhi Technological University (DTU / DCE, Delhi)',
  'Netaji Subhas University of Technology (NSUT, Delhi)',
  'Jadavpur University (Kolkata, WB)',
  'Amity University (Noida, Lucknow, Jaipur, Gurgaon)',
  'Manipal Academy of Higher Education (MAHE Manipal/Jaipur)',
  'Christ University (Bengaluru, KA)',
  'PES University (Bengaluru, KA)',
  'RV College of Engineering (RVCE Bengaluru, KA)',
  'BMS College of Engineering (BMSCE Bengaluru, KA)',
  'State Government Engineering College',
  'State Arts, Commerce & Science Degree College',
  'Local Polytechnic / Diploma Institute',
  'International / Overseas University',
  'Other (Type Custom College)',
];

const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'AI / ML Engineer',
  'DevOps Engineer',
  'Mobile App Developer',
  'UI / UX Designer',
  'QA / Automation Engineer',
  'Product Manager',
  'Other',
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    qualification: '',
    department: '',
    college: '',
    location: '',
    domain: '',
    targetRole: '',
    dailyHours: '2',
    yearsExp: '',
    prevCompany: '',
    switchReason: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dual-channel (Email / Phone) OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpChannel, setOtpChannel] = useState('EMAIL'); // 'EMAIL' or 'PHONE'
  const [otpSentTarget, setOtpSentTarget] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer for resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handle = e => {
    setForm(f => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const set = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: val,
    }));
  };

  const totalSteps = role === 'EXPERIENCED' ? 4 : 3;

  // Step 1: User completes form & requests 6-digit OTP via chosen channel
  const requestOtpAndOpenModal = async (targetChannel = null, customPhone = null) => {
    setError('');
    setOtpError('');
    setOtpSuccessMsg('');

    // Determine channel (defaults to currently selected otpChannel or EMAIL)
    const channelToUse = (typeof targetChannel === 'string' && ['EMAIL', 'PHONE'].includes(targetChannel))
      ? targetChannel
      : (typeof otpChannel === 'string' ? otpChannel : 'EMAIL');

    // Basic validations
    if (!form.name || form.name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const phoneToSend = typeof customPhone === 'string' ? customPhone : form.phone;

    if (channelToUse === 'PHONE' && (!phoneToSend || phoneToSend.trim().length < 5)) {
      setOtpChannel('PHONE');
      setShowOtpModal(true);
      setOtpError('Please enter a valid phone number below to receive your OTP via SMS.');
      return;
    }

    setLoading(true);
    setOtpLoading(true);
    try {
      const response = await api.post('/auth/send-otp', {
        email: form.email,
        phone: phoneToSend,
        name: form.name,
        channel: channelToUse,
      });

      setOtpChannel(channelToUse);
      setOtpSentTarget(response.data.target || (channelToUse === 'PHONE' ? phoneToSend : form.email));
      setOtpSuccessMsg(response.data.message || `A 6-digit OTP code has been sent via ${channelToUse === 'PHONE' ? 'SMS' : 'Email'}!`);
      setShowOtpModal(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setCooldown(30); // 30s cooldown
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send verification OTP code.';
      if (showOtpModal) {
        setOtpError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setOtpLoading(false);
    }
  };

  // Switch channel (Email <-> Phone) inside OTP Modal
  const handleChannelChange = async (newChannel) => {
    if (newChannel === otpChannel && showOtpModal) return;
    setOtpChannel(newChannel);
    setOtpError('');
    setOtpSuccessMsg('');
    await requestOtpAndOpenModal(newChannel);
  };

  // Resend OTP via active channel
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setOtpError('');
    setOtpSuccessMsg('');
    setOtpLoading(true);
    try {
      const response = await api.post('/auth/send-otp', {
        email: form.email,
        phone: form.phone,
        name: form.name,
        channel: otpChannel,
      });
      setCooldown(30);
      setOtpError('');
      if (response.data.devOtp) setDevOtpHint(response.data.devOtp);
      setOtpSuccessMsg(response.data.message || `Resent OTP via ${otpChannel === 'PHONE' ? 'SMS' : 'Email'}.`);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP Input handlers (Auto-advance & Paste)
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpDigits(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const verifyAndSubmit = async () => {
    const otpString = otpDigits.join('');
    if (otpString.length !== 6) {
      setOtpError('Please enter the full 6-digit OTP verification code.');
      return;
    }

    setOtpError('');
    setOtpLoading(true);

    try {
      // 1. Verify OTP
      await api.post('/auth/verify-otp', {
        email: form.email,
        phone: form.phone,
        otp: otpString,
        channel: otpChannel,
      });

      // 2. Complete Account Registration
      await register({
        ...form,
        role,
        otp: otpString,
        channel: otpChannel,
        dailyHours: parseFloat(form.dailyHours),
        yearsExp: form.yearsExp ? parseInt(form.yearsExp) : undefined,
      });

      setShowOtpModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setOtpError(err.response?.data?.error || 'Verification failed. Please check your 6-digit code.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[480px] animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">
            Place<span className="text-accent-blue">Mate</span> AI
          </h1>

          <p className="text-muted text-[13px] mt-1">
            Create your free account
          </p>
        </div>

        <div className="bg-card border border-border rounded-card shadow-card p-8">

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-[12px] text-muted mb-2 font-medium">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
            </div>

            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-[13px]">
              {error}
            </div>
          )}

          {/* Step 1: Select Role */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text mb-4">
                What best describes you?
              </h2>

              {ROLES.map(r => {
                const Icon = r.icon;
                const isSelected = role === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-accent-blue bg-accent-blue/5 shadow-sm'
                        : 'border-border bg-surface hover:border-accent-blue/40'
                    }`}
                    id={`signup-role-${r.id.toLowerCase()}`}
                  >
                    <div
                      className={`p-2.5 rounded-lg ${
                        isSelected
                          ? 'bg-accent-blue text-white'
                          : 'bg-card text-muted'
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-text text-[14px]">
                        {r.label}
                      </p>
                      <p className="text-muted text-[12px] mt-0.5">
                        {r.desc}
                      </p>
                    </div>
                  </button>
                );
              })}

              <Button
                variant="primary"
                disabled={!role}
                className="w-full mt-6"
                icon={ChevronRight}
                onClick={() => setStep(2)}
                id="signup-next-1"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text mb-4">
                Personal Information
              </h2>

              <Field label="Full Name *" id="signup-name">
                <input
                  id="signup-name"
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="e.g. Rahul Sharma"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Email Address *" id="signup-email">
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="rahul@example.com"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Password (8+ chars) *" id="signup-password">
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handle}
                  placeholder="••••••••"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Phone Number" id="signup-phone">
                <input
                  id="signup-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handle}
                  placeholder="+91 98765 43210"
                  className={INPUT_CLASS}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  icon={ChevronLeft}
                  onClick={() => setStep(1)}
                  id="signup-back-2"
                >
                  Back
                </Button>

                <Button
                  variant="primary"
                  disabled={!form.name || !form.email || !form.password}
                  className="flex-1"
                  icon={ChevronRight}
                  onClick={() => setStep(3)}
                  id="signup-next-2"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Academic / Career Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text mb-4">
                {role === 'EXPERIENCED'
                  ? 'Professional & Learning Goals'
                  : 'Academic & Career Goals'}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <DropdownSelect
                  id="signup-qualification"
                  label="Qualification *"
                  options={QUALIFICATIONS}
                  value={form.qualification}
                  onChange={v => set('qualification', v)}
                />

                <DropdownSelect
                  id="signup-department"
                  label="Department *"
                  options={DEPARTMENTS}
                  value={form.department}
                  onChange={v => set('department', v)}
                />
              </div>

              <DropdownSelect
                id="signup-college"
                label="College / Institution *"
                options={INSTITUTIONS}
                value={form.college}
                onChange={v => set('college', v)}
              />

              <DropdownSelect
                id="signup-location"
                label="Location *"
                options={LOCATIONS}
                value={form.location}
                onChange={v => set('location', v)}
              />

              <div className="grid grid-cols-2 gap-3">
                <DropdownSelect
                  id="signup-domain"
                  label="Primary Domain *"
                  options={DOMAINS}
                  value={form.domain}
                  onChange={v => set('domain', v)}
                />

                <DropdownSelect
                  id="signup-target-role"
                  label="Target Role *"
                  options={TARGET_ROLES}
                  value={form.targetRole}
                  onChange={v => set('targetRole', v)}
                />
              </div>

              <DropdownSelect
                id="signup-daily-hours"
                label="Daily Study Commitment"
                options={DAILY_HOURS.map(h => ({
                  value: String(h),
                  label: `${h} hour${h > 1 ? 's' : ''} / day`,
                }))}
                value={form.dailyHours}
                onChange={v => set('dailyHours', v)}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  icon={ChevronLeft}
                  onClick={() => setStep(2)}
                  id="signup-back-3"
                >
                  Back
                </Button>

                {role === 'EXPERIENCED' ? (
                  <Button
                    variant="primary"
                    disabled={
                      !form.qualification ||
                      !form.department ||
                      !form.college ||
                      !form.domain ||
                      !form.targetRole
                    }
                    className="flex-1"
                    icon={ChevronRight}
                    onClick={() => setStep(4)}
                    id="signup-next-3"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    loading={loading}
                    disabled={
                      !form.qualification ||
                      !form.department ||
                      !form.college ||
                      !form.domain ||
                      !form.targetRole
                    }
                    className="flex-1"
                    onClick={requestOtpAndOpenModal}
                    id="signup-submit"
                    icon={ShieldCheck}
                  >
                    Verify Email &amp; Create Account
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Experienced Professionals only */}
          {step === 4 && role === 'EXPERIENCED' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text mb-4">
                Work Experience
              </h2>

              <Field label="Years of Experience" id="signup-years-exp">
                <input
                  id="signup-years-exp"
                  name="yearsExp"
                  type="number"
                  min="0"
                  max="40"
                  value={form.yearsExp}
                  onChange={handle}
                  placeholder="e.g. 2"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field
                label="Previous / Current Company"
                id="signup-prev-company"
              >
                <input
                  id="signup-prev-company"
                  name="prevCompany"
                  value={form.prevCompany}
                  onChange={handle}
                  placeholder="Company name"
                  className={INPUT_CLASS}
                />
              </Field>

              <Field
                label="Reason for Switching"
                id="signup-switch-reason"
              >
                <textarea
                  id="signup-switch-reason"
                  name="switchReason"
                  value={form.switchReason}
                  onChange={handle}
                  placeholder="Brief reason for career transition..."
                  rows={3}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </Field>

              <p className="text-[11px] text-muted bg-surface rounded-lg px-3 py-2">
                Resume upload available in your Profile after account creation.
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  icon={ChevronLeft}
                  onClick={() => setStep(3)}
                  id="signup-back-4"
                >
                  Back
                </Button>

                <Button
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                  onClick={requestOtpAndOpenModal}
                  id="signup-submit-final"
                  icon={ShieldCheck}
                >
                  Verify Email &amp; Create Account
                </Button>
              </div>
            </div>
          )}

          {/* Login link */}
          <p className="text-center text-[12px] text-muted mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-accent-blue hover:underline font-medium"
              id="signup-to-login"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

      {/* 🔐 DUAL-CHANNEL (EMAIL / PHONE) 6-DIGIT OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-accent-blue/30 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-text p-1 rounded-lg transition-colors"
              id="otp-close-btn"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-text">Account OTP Verification</h3>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Choose your preferred method to receive the <strong>6-digit verification OTP</strong>:
              </p>
            </div>

            {/* Verification Channel Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-surface p-1.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => handleChannelChange('EMAIL')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                  otpChannel === 'EMAIL'
                    ? 'bg-accent-blue text-white shadow-md'
                    : 'text-muted hover:text-text hover:bg-card/50'
                }`}
                id="otp-channel-email"
              >
                <Mail size={16} />
                Email OTP
              </button>

              <button
                type="button"
                onClick={() => handleChannelChange('PHONE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                  otpChannel === 'PHONE'
                    ? 'bg-accent-blue text-white shadow-md'
                    : 'text-muted hover:text-text hover:bg-card/50'
                }`}
                id="otp-channel-phone"
              >
                <Smartphone size={16} />
                Phone / SMS OTP
              </button>
            </div>

            {/* Target Channel Info or Phone Number Input */}
            {otpChannel === 'PHONE' && !form.phone ? (
              <div className="bg-surface/60 border border-accent-blue/30 rounded-xl p-3.5 space-y-2">
                <label className="text-[12px] font-medium text-text block">
                  Enter your phone number for SMS OTP:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                    id="otp-modal-phone-input"
                  />
                  <Button
                    variant="primary"
                    loading={otpLoading}
                    disabled={!form.phone || form.phone.trim().length < 5}
                    onClick={() => requestOtpAndOpenModal('PHONE', form.phone)}
                    className="py-2 text-[12px] px-3"
                    id="otp-modal-send-phone-btn"
                  >
                    Send OTP
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-[12.5px] text-muted">
                {otpChannel === 'PHONE' ? (
                  <span>
                    📱 Code sent via SMS to <strong className="text-accent-blue font-semibold">{otpSentTarget || form.phone}</strong>
                  </span>
                ) : (
                  <span>
                    ✉️ Code sent via Email to <strong className="text-accent-blue font-semibold">{otpSentTarget || form.email}</strong>
                  </span>
                )}
              </div>
            )}

            {/* 6 OTP Input Boxes */}
            <div className="flex justify-center gap-2 my-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 text-center text-[22px] font-extrabold bg-surface border border-border focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 rounded-xl text-text focus:outline-none transition-all"
                  id={`otp-input-${idx}`}
                />
              ))}
            </div>

            {otpSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-[12px] text-center font-medium">
                {otpSuccessMsg}
              </div>
            )}

            {otpError && (
              <div className="p-2.5 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-[12px] text-center">
                {otpError}
              </div>
            )}

            <Button
              variant="primary"
              loading={otpLoading}
              disabled={otpDigits.join('').length !== 6}
              onClick={verifyAndSubmit}
              className="w-full py-3 text-[14px]"
              icon={CheckCircle2}
              id="otp-submit-btn"
            >
              Verify OTP &amp; Complete Signup
            </Button>

            <div className="flex items-center justify-between text-[12px] text-muted pt-1">
              <span>Didn't receive code?</span>
              <button
                type="button"
                disabled={cooldown > 0 || otpLoading}
                onClick={handleResendOtp}
                className={`font-semibold flex items-center gap-1 transition-colors ${
                  cooldown > 0 ? 'opacity-50 cursor-not-allowed text-muted' : 'text-accent-blue hover:underline'
                }`}
                id="otp-resend-btn"
              >
                <RefreshCw size={12} className={otpLoading ? 'animate-spin' : ''} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : `Resend via ${otpChannel === 'PHONE' ? 'SMS' : 'Email'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const INPUT_CLASS =
  'w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue transition-colors';

function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[12px] font-medium text-muted"
      >
        {label}
      </label>

      {children}
    </div>
  );
}