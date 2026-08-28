import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import KpiRing from '../../shared/charts/KpiRing';

function SkillRadar({ data }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map(s => ({ subject: s.name, value: s.proficiency }));
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#22304C" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B96AD', fontSize: 10 }} />
          <Radar
            name="Proficiency"
            dataKey="value"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            dot={{ fill: '#3B82F6', r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SkillBar({ name, proficiency, evidence, category }) {
  const color = proficiency >= 70 ? 'bg-accent-green' : proficiency >= 40 ? 'bg-accent-amber' : 'bg-accent-red';
  const badge = proficiency >= 70 ? 'green' : proficiency >= 40 ? 'amber' : 'red';
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-text">{name}</span>
          <Badge color="muted" size="xs">{category}</Badge>
          {evidence && <span className="text-[10px] text-muted italic">{evidence}</span>}
        </div>
        <Badge color={badge} size="xs">{proficiency}%</Badge>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${proficiency}%` }} />
      </div>
    </div>
  );
}

function UpdateSkillModal({ onClose, onSaved }) {
  const [skillName, setSkillName]   = useState('');
  const [proficiency, setProficiency] = useState(50);
  const [evidence, setEvidence]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const save = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/skill-twin/skill', { skillName, proficiency, evidence });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update skill');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4">
        <h3 className="text-[15px] font-semibold text-text mb-4">Update Skill</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-muted mb-1 block">Skill Name</label>
            <input
              id="update-skill-name"
              value={skillName}
              onChange={e => setSkillName(e.target.value)}
              placeholder="e.g. Python, React, SQL"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-text focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div>
            <label className="text-[12px] text-muted mb-1 block">Proficiency: {proficiency}%</label>
            <input
              id="update-skill-proficiency"
              type="range"
              min="0"
              max="100"
              value={proficiency}
              onChange={e => setProficiency(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>Beginner</span><span>Intermediate</span><span>Expert</span>
            </div>
          </div>
          <div>
            <label className="text-[12px] text-muted mb-1 block">Evidence (optional)</label>
            <input
              id="update-skill-evidence"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              placeholder="e.g. Built 3 projects, Completed course"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-text focus:outline-none focus:border-accent-blue"
            />
          </div>
          {error && <p className="text-[12px] text-accent-red">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose} id="skill-modal-cancel">Cancel</Button>
            <Button variant="primary" className="flex-1" loading={loading} onClick={save}
              disabled={!skillName.trim()} id="skill-modal-save">
              Save Skill
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SkillTwinPage() {
  const [twin, setTwin]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [filter, setFilter]   = useState('all'); // 'all' | 'strengths' | 'gaps'

  const fetch = async () => {
    const { data } = await api.get('/skill-twin');
    setTwin(data);
  };

  useEffect(() => {
    fetch().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  const skills = twin?.skills || twin?.currentSkills || [];
  const strengths = skills.filter(s => s.proficiency >= 70);
  const gaps      = skills.filter(s => s.proficiency < 40);
  const moderate  = skills.filter(s => s.proficiency >= 40 && s.proficiency < 70);

  const displayGaps = gaps.length > 0 ? gaps : (twin?.weakAreas || []);
  const filteredSkills = filter === 'strengths' ? strengths : filter === 'gaps' ? displayGaps : skills;
  const radarData = skills.length >= 3 ? skills.slice(0, 8) : (twin?.currentSkills || []).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      {modal && (
        <UpdateSkillModal
          onClose={() => setModal(false)}
          onSaved={() => { setModal(false); fetch(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-text">Skill Twin</h2>
          <p className="text-[12px] text-muted mt-0.5">Your AI-computed skill profile and readiness score</p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setModal(true)} id="skill-twin-add">
          Update Skill
        </Button>
      </div>

      {/* Readiness + summary cards — uniform equal heights & typography */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Readiness Ring Card */}
        <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[150px]">
          <KpiRing value={twin?.readinessScore || 0} color="#8B5CF6" size="md" label="Readiness Score" />
        </Card>

        {/* Strengths Card */}
        <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[150px]">
          <span className="text-[32px] font-bold text-accent-green leading-none mb-2">
            {strengths.length}
          </span>
          <div className="flex items-center justify-center gap-1.5 text-accent-green">
            <CheckCircle size={14} className="flex-shrink-0" />
            <span className="text-[11px] font-medium text-muted">Strengths (≥70%)</span>
          </div>
        </Card>

        {/* Developing Card */}
        <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[150px]">
          <span className="text-[32px] font-bold text-accent-amber leading-none mb-2">
            {moderate.length}
          </span>
          <div className="flex items-center justify-center gap-1.5 text-accent-amber">
            <TrendingUp size={14} className="flex-shrink-0" />
            <span className="text-[11px] font-medium text-muted">Developing (40–69%)</span>
          </div>
        </Card>

        {/* Gaps Card */}
        <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[150px]">
          <span className="text-[32px] font-bold text-accent-red leading-none mb-2">
            {gaps.length}
          </span>
          <div className="flex items-center justify-center gap-1.5 text-accent-red">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span className="text-[11px] font-medium text-muted">Gaps (&lt;40%)</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <Card id="skill-radar-card">
          <h3 className="text-[13px] font-semibold text-text mb-4">Skill Radar</h3>
          {radarData.length > 2
            ? <SkillRadar data={radarData} />
            : <p className="text-[12px] text-muted text-center py-8">Add at least 3 skills to see radar chart</p>
          }
        </Card>

        {/* Critical gaps */}
        <Card id="skill-gaps-card">
          <h3 className="text-[13px] font-semibold text-text mb-4">Critical Gaps</h3>
          {displayGaps.length === 0
            ? <p className="text-[12px] text-muted">No critical gaps — great work!</p>
            : displayGaps.map((s, i) => <SkillBar key={s.id || s.name || i} {...s} />)
          }
        </Card>
      </div>

      {/* Dynamic Resume ATS Analysis Card */}
      <Card id="resume-analysis-card" className="p-5 space-y-4 bg-gradient-to-r from-surface via-card to-accent-blue/10 border-accent-blue/20">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-[14px] font-bold text-text flex items-center gap-2">
              <Brain size={18} className="text-accent-blue" />
              Resume Analysis &amp; ATS Role Match
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              {twin?.resumeAnalysis?.summary || 'AI-computed match percentage against your target role'}
            </p>
          </div>
          <Badge color={twin?.resumeAnalysis?.atsScore >= 70 ? 'green' : 'amber'} size="md">
            {twin?.resumeAnalysis?.atsScore || 65}% ATS Match
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-bold text-accent-green uppercase tracking-wider block mb-2">
              ✓ Verified Resume Skills ({twin?.resumeAnalysis?.extractedSkills?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(twin?.resumeAnalysis?.extractedSkills || []).map((sk, idx) => (
                <span key={idx} className="bg-accent-green/15 text-accent-green text-[11px] font-medium px-2.5 py-1 rounded-lg border border-accent-green/30">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-accent-amber uppercase tracking-wider block mb-2">
              ⚠️ Missing Keywords for {twin?.resumeAnalysis?.targetRole || 'Target Role'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(twin?.resumeAnalysis?.missingKeywords || ['Docker', 'AWS', 'System Design']).map((kw, idx) => (
                <span key={idx} className="bg-accent-amber/15 text-accent-amber text-[11px] font-medium px-2.5 py-1 rounded-lg border border-accent-amber/30">
                  + {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* All skills */}
      <Card id="skill-all-card">
        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-text">All Skills</h3>
          <div className="flex gap-1 bg-surface rounded-lg p-1">
            {[['all', 'All'], ['strengths', 'Strengths'], ['gaps', 'Gaps']].map(([val, lbl]) => (
              <button
                key={val}
                id={`skill-filter-${val}`}
                onClick={() => setFilter(val)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors
                  ${filter === val ? 'bg-card text-text' : 'text-muted hover:text-text'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {filteredSkills.length === 0
          ? <p className="text-[12px] text-muted text-center py-8">No skills yet. Click "Update Skill" to add your proficiencies.</p>
          : filteredSkills.map((s, i) => <SkillBar key={s.id || s.name || i} {...s} />)
        }
      </Card>
    </div>
  );
}
