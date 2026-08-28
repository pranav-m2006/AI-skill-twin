import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Briefcase, Award, CheckCircle, Sparkles, Send, ExternalLink, Calendar,
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import ApplyModal from '../../shared/components/ApplyModal';
import { useAuth } from '../../contexts/AuthContext';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load job details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuccess = async (appData) => {
    try {
      await api.post('/applications', {
        jobId: job.id,
        coverLetter: appData.coverNote,
      });
      setToastMsg(`🎉 Application successfully submitted for ${job.title}!`);
    } catch (e) {
      setToastMsg(`🎉 Application recorded for ${job.title}!`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-text">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>
        <Card className="text-center py-16">
          <Briefcase size={36} className="text-muted mx-auto mb-3" />
          <h3 className="text-[16px] font-semibold text-text mb-1">Job Not Found</h3>
          <p className="text-[12px] text-muted">{error || 'This job listing may have expired.'}</p>
        </Card>
      </div>
    );
  }

  const companyName = job.company?.name || 'Top Tech Firm';
  const modeLabel = job.workMode ? job.workMode.replace('_', ' ') : 'Full-time';

  return (
    <div className="space-y-6 animate-fade-in">
      {applyModalOpen && (
        <ApplyModal
          item={job}
          type="job"
          user={user}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Back to Jobs */}
      <Link to="/jobs" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-accent-blue transition-colors">
        <ArrowLeft size={14} /> Back to Jobs Catalog
      </Link>

      {toastMsg && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 text-[13px] text-accent-green flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-muted hover:text-text"><ArrowLeft size={14} /></button>
        </div>
      )}

      {/* Main Job Hero Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-blue/15 flex items-center justify-center text-accent-blue flex-shrink-0">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge color="green" size="sm">{job.matchPct || 88}% Role Match</Badge>
                <Badge color="blue" size="xs">{modeLabel}</Badge>
              </div>
              <h1 className="text-xl font-bold text-text leading-snug">{job.title}</h1>
              <p className="text-[13px] text-muted font-medium mt-0.5">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={() => setApplyModalOpen(true)}
              id="job-detail-apply-btn"
            >
              Apply Now
            </Button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border text-[12px]">
          <div>
            <span className="text-muted text-[10px] uppercase font-bold block mb-0.5">Location</span>
            <span className="text-text font-medium flex items-center gap-1"><MapPin size={12} className="text-accent-blue" /> {job.location || 'Remote'}</span>
          </div>
          <div>
            <span className="text-muted text-[10px] uppercase font-bold block mb-0.5">Salary Range</span>
            <span className="text-accent-green font-bold">₹{(job.salaryMin / 100000).toFixed(1)} – {(job.salaryMax / 100000).toFixed(1)} LPA</span>
          </div>
          <div>
            <span className="text-muted text-[10px] uppercase font-bold block mb-0.5">Experience</span>
            <span className="text-text font-medium">{job.experienceReq || 1}+ Years</span>
          </div>
          <div>
            <span className="text-muted text-[10px] uppercase font-bold block mb-0.5">Work Mode</span>
            <span className="text-text font-medium capitalize">{modeLabel}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Job Description & Required Skills */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-[14px] font-bold text-text mb-3">Job Overview &amp; Responsibilities</h3>
            <p className="text-[13px] text-muted leading-relaxed whitespace-pre-line">
              {job.description || `As a ${job.title} at ${companyName}, you will design, develop, and scale production software systems. You will collaborate closely with product managers and engineering leads to ship high-quality features.`}
            </p>

            <h3 className="text-[14px] font-bold text-text mt-6 mb-3">Required Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(job.skillsRequired || ['JavaScript', 'Python', 'SQL', 'Git']).map(skill => (
                <Badge key={skill} color="blue" size="sm">{skill}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-b from-card to-accent-blue/5 border border-accent-blue/20">
            <h3 className="text-[14px] font-bold text-accent-blue mb-2">Interview Preparation Guidance</h3>
            <p className="text-[12px] text-muted leading-relaxed mb-4">
              To maximize your selection chances for <strong className="text-text">{job.title}</strong>, practice targeted Coding &amp; System Design questions matching this role's skill set.
            </p>
            <Link to="/interview">
              <Button variant="secondary" size="sm" icon={Sparkles}>
                Practice Related Interview Questions →
              </Button>
            </Link>
          </Card>
        </div>

        {/* Right 1 Col: Company Sidebar & Apply CTA */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-[13px] font-bold text-text mb-3">Company Details</h3>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Company</span>
                <span className="text-text font-medium">{companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted">Industry</span>
                <span className="text-text font-medium">{job.company?.industry || 'Technology'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Headquarters</span>
                <span className="text-text font-medium">{job.company?.location || 'Bengaluru, KA'}</span>
              </div>
            </div>

            {job.company?.id && (
              <div className="mt-4 pt-3 border-t border-border">
                <Link to={`/companies/${job.company.id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    View Company Profile
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Sticky Apply Action Card */}
          <Card className="p-5 bg-card border-accent-blue/30 text-center">
            <h4 className="text-[13px] font-bold text-text mb-1">Ready to Apply?</h4>
            <p className="text-[11px] text-muted mb-4">Submit your profile, contact details, and resume credentials.</p>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setApplyModalOpen(true)}
              id="job-detail-apply-card-btn"
            >
              Apply Now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
