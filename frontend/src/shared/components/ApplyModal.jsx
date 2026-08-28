import { useState } from 'react';
import { X, CheckCircle, Upload, FileText, Send, Building2, Briefcase, User, Mail, Phone, Link as LinkIcon, GraduationCap } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export default function ApplyModal({ item, type = 'job', user, onClose, onSuccess }) {
  const [name, setName]               = useState(user?.name || '');
  const [email, setEmail]             = useState(user?.email || '');
  const [phone, setPhone]             = useState('');
  const [qualification, setQual]     = useState('B.Tech / B.E. Computer Science');
  const [portfolioUrl, setPortfolio]  = useState('');
  const [coverNote, setCoverNote]     = useState('');
  const [resumeOption, setResumeOpt]  = useState('profile'); // 'profile' | 'upload'
  const [file, setFile]               = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [appId, setAppId]             = useState('');
  const [error, setError]             = useState('');

  const title       = item?.title || 'Position';
  const companyName = item?.company?.name || item?.company || 'Company';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (onSuccess) {
        await onSuccess({
          jobId: item.jobId || item.id,
          name,
          email,
          phone,
          qualification,
          portfolioUrl,
          coverNote,
          resumeOption,
        });
      }
      const refCode = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
      setAppId(refCode);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
      <Card className="w-full max-w-lg relative border-accent-blue/30 shadow-glow my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
          id="apply-modal-close"
        >
          <X size={18} />
        </button>

        {submitted ? (
          /* Confirmation Screen */
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-accent-green/20 text-accent-green flex items-center justify-center mx-auto">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text">Application Submitted!</h3>
              <p className="text-[12px] text-muted mt-1">
                Your credentials and resume have been sent to <strong className="text-text">{companyName}</strong> for <strong className="text-text">{title}</strong>.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 inline-block font-mono text-[12px]">
              <span className="text-muted">Ref ID: </span>
              <span className="text-accent-blue font-bold">{appId}</span>
            </div>
            <div className="pt-2">
              <Button variant="primary" onClick={onClose} className="w-full">
                Done &amp; Close
              </Button>
            </div>
          </div>
        ) : (
          /* Application Form */
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center text-accent-blue flex-shrink-0">
                {type === 'internship' ? <Briefcase size={20} /> : <Building2 size={20} />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-accent-blue">
                  {type === 'internship' ? 'Internship Application' : 'Job Application'}
                </span>
                <h3 className="text-[15px] font-bold text-text leading-tight">{title}</h3>
                <p className="text-[11px] text-muted">{companyName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted mb-1 flex items-center gap-1">
                    <User size={11} /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                    id="apply-name"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted mb-1 flex items-center gap-1">
                    <Mail size={11} /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                    id="apply-email"
                  />
                </div>
              </div>

              {/* Phone & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted mb-1 flex items-center gap-1">
                    <Phone size={11} /> Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                    id="apply-phone"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted mb-1 flex items-center gap-1">
                    <GraduationCap size={11} /> Degree / Qualification
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={e => setQual(e.target.value)}
                    placeholder="B.Tech / MCA / Degree"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                    id="apply-qualification"
                  />
                </div>
              </div>

              {/* Portfolio Link */}
              <div>
                <label className="text-[11px] font-medium text-muted mb-1 flex items-center gap-1">
                  <LinkIcon size={11} /> Portfolio / GitHub / LinkedIn URL
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolio(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                  id="apply-portfolio"
                />
              </div>

              {/* Resume Selection */}
              <div>
                <label className="text-[11px] font-medium text-muted mb-1.5 block">
                  Resume Attachment
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setResumeOpt('profile')}
                    className={`px-3 py-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      resumeOption === 'profile'
                        ? 'bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold'
                        : 'bg-surface border-border text-muted hover:text-text'
                    }`}
                  >
                    <FileText size={13} /> Use ATS Profile Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeOpt('upload')}
                    className={`px-3 py-2 rounded-xl text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                      resumeOption === 'upload'
                        ? 'bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold'
                        : 'bg-surface border-border text-muted hover:text-text'
                    }`}
                  >
                    <Upload size={13} /> Upload New File
                  </button>
                </div>
                {resumeOption === 'upload' && (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setFile(e.target.files[0])}
                    className="w-full bg-surface border border-border rounded-xl p-2 text-[11px] text-text"
                  />
                )}
              </div>

              {/* Cover Note */}
              <div>
                <label className="text-[11px] font-medium text-muted mb-1 block">
                  Short Statement / Why You're a Fit
                </label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="Briefly state your relevant skills and enthusiasm for this role..."
                  rows={2}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text focus:outline-none focus:border-accent-blue"
                  id="apply-cover"
                />
              </div>

              {error && <p className="text-[12px] text-accent-red font-medium">{error}</p>}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon={Send}
                  id="apply-submit-btn"
                >
                  Submit Application &amp; Credentials
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
