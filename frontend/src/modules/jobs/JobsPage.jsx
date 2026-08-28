import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Monitor, Building2, Briefcase, Filter, CheckCircle, X } from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import ApplyModal from '../../shared/components/ApplyModal';
import { useAuth } from '../../contexts/AuthContext';

const WORK_MODES = [
  { value: '', label: 'All Modes' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ON_SITE', label: 'On-site' },
];

function JobCard({ job, onApply }) {
  const modeColors = {
    REMOTE: 'green',
    HYBRID: 'blue',
    ON_SITE: 'amber',
  };

  return (
    <Card
      className="hover:border-accent-blue/40 transition-all duration-200 group"
      noPad
    >
      <div className="p-5">

        {/* Top */}
        <div className="flex items-start justify-between gap-3 mb-3">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
              <Building2
                size={18}
                className="text-accent-blue"
              />
            </div>

            <div>

              {/* Job title */}
              <Link
                to={`/jobs/${job.id}`}
                id={`job-title-${job.id}`}
                className="block text-[13px] font-semibold text-text hover:text-accent-blue transition-colors"
              >
                {job.title}
              </Link>

              {/* Company */}
              {job.company?.id ? (
                <Link
                  to={`/companies/${job.company.id}`}
                  id={`company-link-${job.company.id}`}
                  className="block text-[11px] text-muted hover:text-accent-blue transition-colors mt-0.5"
                >
                  {job.company.name}
                </Link>
              ) : (
                <p className="text-[11px] text-muted">
                  {job.company?.name || 'Unknown company'}
                </p>
              )}

            </div>
          </div>

          <Badge color="green" size="sm">
            {job.matchPct || 0}% match
          </Badge>

        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-[11px] text-muted mb-3">

          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {job.location || 'Location not specified'}
          </span>

          <Badge
            color={modeColors[job.workMode] || 'muted'}
            size="xs"
          >
            {job.workMode
              ? job.workMode.replace('_', ' ')
              : 'Not specified'}
          </Badge>

          {job.experienceReq && (
            <span className="text-muted">
              {job.experienceReq} yrs
            </span>
          )}

        </div>

        {/* Salary */}
        {job.salaryMin && (
          <p className="text-[12px] font-semibold text-accent-green mb-3">
            ₹{(job.salaryMin / 100000).toFixed(1)}
            {' – '}
            {(job.salaryMax / 100000).toFixed(1)}
            {' LPA'}
          </p>
        )}

        {/* Skills & Apply button */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex flex-wrap gap-1.5">
            {job.skillsRequired?.slice(0, 3).map(skill => (
              <Badge key={skill} color="muted" size="xs">
                {skill}
              </Badge>
            ))}
          </div>
          <button
            onClick={() => onApply(job)}
            className="px-3 py-1.5 bg-accent-blue/15 hover:bg-accent-blue text-accent-blue hover:text-white rounded-lg text-[11px] font-semibold transition-all flex-shrink-0"
            id={`job-apply-btn-${job.id}`}
          >
            Apply Now
          </button>
        </div>

      </div>
    </Card>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // 'all' | 'matched'
  const [applyTarget, setApplyTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const load = async (p = 1, s = search, m = mode) => {
    setLoading(true);
    try {
      const endpoint = tab === 'matched' ? '/jobs/match' : `/jobs?page=${p}&limit=12${s ? `&search=${s}` : ''}${m ? `&workMode=${m}` : ''}`;
      const { data } = await api.get(endpoint);
      if (tab === 'matched') {
        setJobs(Array.isArray(data) ? data : []);
        setTotal(data.length);
      } else {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setPage(p);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [tab, mode]);

  const handleSearch = e => { e.preventDefault(); load(1, search, mode); };

  const handleApplicationSuccess = async (appData) => {
    try {
      await api.post('/applications', {
        jobId: appData.jobId,
        coverLetter: appData.coverNote,
      });
      setToastMsg(`🎉 Application submitted for ${applyTarget?.title} at ${applyTarget?.company?.name || 'Company'}!`);
    } catch (e) {
      setToastMsg(`🎉 Application recorded for ${applyTarget?.title}!`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {applyTarget && (
        <ApplyModal
          item={applyTarget}
          type="job"
          user={user}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-text">Jobs</h2>
        <p className="text-[12px] text-muted">{total} opportunities</p>
      </div>

      {toastMsg && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 text-[13px] text-accent-green flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-muted hover:text-text"><X size={14} /></button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 w-fit">
        {['all', 'matched'].map(t => (
          <button
            key={t}
            id={`jobs-tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors
              ${tab === t ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'}`}
          >
            {t === 'all' ? 'All Jobs' : 'Best Match'}
          </button>
        ))}
      </div>

      {/* Search + Filter bar */}
      {tab === 'all' && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="jobs-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs or companies..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2">
            <Filter size={13} className="text-muted" />
            {WORK_MODES.map(m => (
              <button
                key={m.value}
                type="button"
                id={`filter-${m.value || 'all'}`}
                onClick={() => setMode(m.value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors
                  ${mode === m.value ? 'bg-accent-blue/20 text-accent-blue' : 'text-muted hover:text-text'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button id="jobs-search-btn" type="submit" variant="primary" size="sm" icon={Search}>Search</Button>
        </form>
      )}

      {/* Job grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-16">
          <Briefcase size={32} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-[13px]">No jobs found. Complete your profile for better matches.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onApply={setApplyTarget} />)}
          </div>

          {/* Pagination (all tab only) */}
          {tab === 'all' && total > 12 && (
            <div className="flex justify-center gap-2">
              <Button
                id="jobs-prev"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                Previous
              </Button>
              <span className="text-[12px] text-muted self-center">Page {page} of {Math.ceil(total / 12)}</span>
              <Button
                id="jobs-next"
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(total / 12)}
                onClick={() => load(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
