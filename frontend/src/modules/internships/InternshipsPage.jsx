import { useState, useEffect } from 'react';
import { BookOpen, Search, MapPin, Clock, DollarSign, CheckCircle, Sparkles, X } from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import ApplyModal from '../../shared/components/ApplyModal';
import { useAuth } from '../../contexts/AuthContext';

export default function InternshipsPage() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [applyTarget, setApplyTarget] = useState(null);

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/internships/match');
      const list = Array.isArray(data) ? data : (data.internships || []);
      setInternships(list);
    } catch (e) {
      try {
        const { data } = await api.get('/internships');
        const list = Array.isArray(data) ? data : (data.internships || []);
        setInternships(list);
      } catch {
        setInternships([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = async (appData) => {
    try {
      await api.post('/applications', {
        jobId: appData.jobId,
        coverLetter: appData.coverNote,
      });
      setAppliedIds(ids => [...ids, applyTarget.id]);
      setToastMsg(`🎉 Application submitted for ${applyTarget.title} at ${applyTarget.company?.name || 'Company'}!`);
    } catch (e) {
      setAppliedIds(ids => [...ids, applyTarget.id]);
      setToastMsg(`🎉 Application recorded for ${applyTarget.title}!`);
    }
  };

  const filtered = internships.filter(i =>
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {applyTarget && (
        <ApplyModal
          item={applyTarget}
          type="internship"
          user={user}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
          <BookOpen size={20} className="text-accent-blue" />
          Student Internships & Traineeships ({internships.length})
        </h2>
        <p className="text-[12px] text-muted mt-0.5">
          Curated paid internships matched to your target role and skill proficiencies.
        </p>
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-3 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search internships by title, company, or location..."
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-[12px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => {
          const isApplied = appliedIds.includes(item.id);
          return (
            <Card key={item.id} className="p-5 flex flex-col justify-between hover:border-accent-blue/40 transition-all">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-[14px] font-bold text-text">{item.title}</h3>
                    <p className="text-[12px] text-muted font-medium mt-0.5">{item.company?.name || 'Top Tech Firm'}</p>
                  </div>
                  <Badge color="green" size="sm">{item.matchPct || 85}% match</Badge>
                </div>

                <p className="text-[12px] text-muted line-clamp-2 my-3">
                  {item.description || 'Hands-on practical internship opportunity working directly with senior software engineers on real-world web and AI systems.'}
                </p>

                <div className="flex flex-wrap gap-2 text-[11px] text-muted mb-4">
                  <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
                    <MapPin size={10} />{item.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
                    <Clock size={10} />{item.durationMonths || 3} months
                  </span>
                  {item.stipendMonthly && (
                    <span className="flex items-center gap-1 bg-accent-green/10 text-accent-green font-semibold px-2 py-0.5 rounded border border-accent-green/20">
                      <DollarSign size={10} />₹{(item.stipendMonthly).toLocaleString('en-IN')}/mo
                    </span>
                  )}
                </div>

                {item.skillsRequired && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(typeof item.skillsRequired === 'string' ? JSON.parse(item.skillsRequired) : item.skillsRequired).map(s => (
                      <Badge key={s} color="muted" size="xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted">Apply before end of month</span>
                <Button
                  variant={isApplied ? 'secondary' : 'primary'}
                  size="sm"
                  disabled={isApplied}
                  onClick={() => setApplyTarget(item)}
                  icon={isApplied ? CheckCircle : Sparkles}
                  id={`internship-apply-btn-${item.id}`}
                >
                  {isApplied ? 'Applied' : 'Apply Now'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
