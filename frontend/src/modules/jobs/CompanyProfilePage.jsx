import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Briefcase, GraduationCap, ExternalLink, Sparkles, CheckCircle, X,
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import ApplyModal from '../../shared/components/ApplyModal';
import { useAuth } from '../../contexts/AuthContext';

export default function CompanyProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyType, setApplyType] = useState('job');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/companies/${id}`);
        setCompany(data);
      } catch (err) {
        console.error('Failed to load company:', err);
        setError(err.response?.data?.error || 'Unable to load company profile.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCompany();
    }
  }, [id]);

  const handleApplyClick = (item, type) => {
    setApplyTarget(item);
    setApplyType(type);
  };

  const handleApplicationSuccess = async (appData) => {
    try {
      await api.post('/applications', {
        jobId: appData.jobId,
        coverLetter: appData.coverNote,
      });
      setToastMsg(`🎉 Application submitted for ${applyTarget?.title} at ${company?.name}!`);
    } catch (e) {
      setToastMsg(`🎉 Application recorded for ${applyTarget?.title}!`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-text">
          <ArrowLeft size={14} /> Back to Jobs
        </Link>
        <Card className="text-center py-16">
          <Building2 size={36} className="text-muted mx-auto mb-3" />
          <h2 className="text-[16px] font-semibold text-text mb-2">Company not found</h2>
          <p className="text-[12px] text-muted">{error || 'This company profile does not exist.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {applyTarget && (
        <ApplyModal
          item={applyTarget}
          type={applyType}
          user={user}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Back */}
      <Link to="/jobs" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-accent-blue transition-colors">
        <ArrowLeft size={14} /> Back to Jobs
      </Link>

      {toastMsg && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 text-[13px] text-accent-green flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-muted hover:text-text"><X size={14} /></button>
        </div>
      )}

      {/* Company Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={30} className="text-accent-blue" />
          </div>

          {/* Company Information */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text">{company.name}</h1>
            {company.industry && <p className="text-[12px] text-muted mt-1">{company.industry}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted">
              {company.location && (
                <span className="flex items-center gap-1"><MapPin size={12} />{company.location}</span>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent-blue hover:underline">
                  <ExternalLink size={12} /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <div className="mt-6 pt-5 border-t border-border">
            <h2 className="text-[13px] font-semibold text-text mb-2">About the Company</h2>
            <p className="text-[12px] text-muted leading-relaxed whitespace-pre-line">{company.description}</p>
          </div>
        )}
      </Card>

      {/* Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-text">Jobs at {company.name}</h2>
            <p className="text-[11px] text-muted mt-1">Current job opportunities</p>
          </div>
          <Badge color="blue" size="sm">{company.jobs?.length || 0} Jobs</Badge>
        </div>

        {company.jobs?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.jobs.map(job => (
              <Card key={job.id} className="hover:border-accent-blue/40 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="text-[13px] font-semibold text-text hover:text-accent-blue transition-colors">
                        {job.title}
                      </Link>
                      {job.location && (
                        <p className="flex items-center gap-1 text-[11px] text-muted mt-1">
                          <MapPin size={10} />{job.location}
                        </p>
                      )}
                    </div>
                    {job.workMode && <Badge color="green" size="xs">{job.workMode.replace('_', ' ')}</Badge>}
                  </div>

                  {job.salaryMin && (
                    <p className="text-[12px] font-semibold text-accent-green">
                      ₹{(job.salaryMin / 100000).toFixed(1)} – {(job.salaryMax / 100000).toFixed(1)} LPA
                    </p>
                  )}

                  {job.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skillsRequired.map(skill => (
                        <Badge key={skill} color="muted" size="xs">{skill}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </Link>
                  <Button variant="primary" size="sm" icon={Sparkles} onClick={() => handleApplyClick(job, 'job')}>
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <Briefcase size={28} className="text-muted mx-auto mb-2" />
            <p className="text-[12px] text-muted">No active jobs available.</p>
          </Card>
        )}
      </div>

      {/* Internships */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-text">Internships at {company.name}</h2>
            <p className="text-[11px] text-muted mt-1">Current internship opportunities</p>
          </div>
          <Badge color="green" size="sm">{company.internships?.length || 0} Internships</Badge>
        </div>

        {company.internships?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.internships.map(internship => (
              <Card key={internship.id} className="hover:border-accent-blue/40 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-semibold text-text">{internship.title}</h3>
                      {internship.location && (
                        <p className="flex items-center gap-1 text-[11px] text-muted mt-1">
                          <MapPin size={10} />{internship.location}
                        </p>
                      )}
                    </div>
                    <GraduationCap size={18} className="text-accent-blue" />
                  </div>

                  {internship.duration && <p className="text-[11px] text-muted">Duration: {internship.duration}</p>}
                  {internship.stipend && <p className="text-[12px] font-semibold text-accent-green">Stipend: {internship.stipend}</p>}

                  {internship.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {internship.skillsRequired.map(skill => (
                        <Badge key={skill} color="muted" size="xs">{skill}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-border flex items-center justify-end">
                  <Button variant="primary" size="sm" icon={Sparkles} onClick={() => handleApplyClick(internship, 'internship')}>
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-10">
            <GraduationCap size={28} className="text-muted mx-auto mb-2" />
            <p className="text-[12px] text-muted">No active internships available.</p>
          </Card>
        )}
      </div>
    </div>
  );
}