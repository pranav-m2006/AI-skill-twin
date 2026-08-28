import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, Award, Target, Sparkles,
  RefreshCw, Star, Brain, TrendingUp, User, Lightbulb,
  Code2, BarChart2, ArrowRight, ChevronDown, ChevronUp, Briefcase
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import KpiRing from '../../shared/charts/KpiRing';

// ─── Experience Tier Config ───────────────────────────────────────────────────
const TIER_CONFIG = {
  fresher: {
    label: 'Fresher / Entry-Level',
    sublabel: '0–1 Year Experience',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10 border-accent-blue/30',
    icon: '🎓',
  },
  junior: {
    label: 'Junior Developer',
    sublabel: '1–2 Years Experience',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10 border-accent-green/30',
    icon: '💼',
  },
  mid: {
    label: 'Mid-Level Engineer',
    sublabel: '3–5 Years Experience',
    color: 'text-accent-amber',
    bg: 'bg-accent-amber/10 border-accent-amber/30',
    icon: '⚙️',
  },
  senior: {
    label: 'Senior Engineer',
    sublabel: '6+ Years Experience',
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple/30',
    icon: '🏆',
  },
};

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
];

export default function ResumeAnalyzerPage() {
  const [tab, setTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async (targetRoleOverride) => {
    setAnalyzing(true);
    try {
      const role = targetRoleOverride || selectedRole;
      const { data: res } = await api.get('/user/resume/analysis', {
        params: { targetRole: role }
      });
      setData(res);
      if (res.analysis?.targetRole) {
        setSelectedRole(res.analysis.targetRole);
      }
    } catch (err) {
      console.error('Failed to fetch resume analysis:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    fetchAnalysis(newRole);
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', selectedRole);
    try {
      const { data: res } = await api.post('/user/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData(d => ({
        ...d,
        hasResume: true,
        resumeUrl: res.resumeUrl,
        resumeText: res.resumeText,
        analysis: res.analysis,
      }));
      setFile(null);
      setShowReplaceForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload and analyze resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!pastedText.trim()) return;
    setUploading(true);
    setError('');
    try {
      const { data: res } = await api.post('/user/resume/text', {
        resumeText: pastedText,
        targetRole: selectedRole,
      });
      setData(d => ({
        ...d,
        hasResume: true,
        resumeText: res.resumeText,
        analysis: res.analysis,
      }));
      setShowReplaceForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze resume text.');
    } finally {
      setUploading(false);
    }
  };

  if (analyzing && !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  const analysis = data?.analysis || {
    atsScore: 0,
    wordCount: 0,
    skillsFound: [],
    requiredSkillsFound: [],
    missingKeywords: ['Python', 'SQL', 'Git', 'Data Structures', 'REST API'],
    bonusSkillsFound: [],
    strengths: [],
    improvements: ['Upload a PDF/DOCX file or paste your resume text to calculate ATS score.'],
    interviewReadiness: { score: 0, dsaSkills: [], systemDesignSkills: [], behavioralKeywords: [] },
    experienceTier: 'fresher',
    experienceInsights: [],
    targetRole: selectedRole,
    jobMatchPct: 0,
    atsPointsBreakdown: {
      skillsMatch: { name: 'Skills & Role Requirement Match', earned: 0, max: 35, pass: false, details: '0 required skills found' },
      sectionCompleteness: { name: 'Formatting & Section Structure', earned: 0, max: 20, pass: false, details: 'No standard sections detected' },
      wordCountDensity: { name: 'Word Count & Text Density', earned: 0, max: 15, pass: false, details: '0 words' },
      actionImpact: { name: 'Action Verbs & Impact Metrics', earned: 0, max: 15, pass: false, details: '0 action verbs' },
      techReadiness: { name: 'Technical & Interview Signals', earned: 0, max: 15, pass: false, details: '0 technical signals' },
    },
  };

  const atsScore = analysis.atsScore || 0;
  const jobMatchPct = analysis.jobMatchPct || 0;
  const interviewScore = analysis.interviewReadiness?.score || 0;
  const tier = TIER_CONFIG[analysis.experienceTier] || TIER_CONFIG.fresher;
  const atsBreakdown = analysis.atsPointsBreakdown || {};

  // Build targeted interview readiness progression plan
  const missingDsa = ['Binary Search', 'Trees & Graphs', 'Dynamic Programming', 'Sliding Window', 'Two Pointers'].filter(
    topic => !analysis.interviewReadiness?.dsaSkills?.some(s => s.toLowerCase().includes(topic.toLowerCase()))
  );
  const missingSysDesign = ['Distributed Caching', 'Database Sharding', 'Load Balancers', 'Microservices', 'Message Queues'].filter(
    topic => !analysis.interviewReadiness?.systemDesignSkills?.some(s => s.toLowerCase().includes(topic.toLowerCase()))
  );
  const missingBehavioral = ['Led end-to-end delivery', 'Reduced latency / cost', 'Mentored junior devs'].filter(
    topic => !analysis.interviewReadiness?.behavioralKeywords?.some(s => s.toLowerCase().includes(topic.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
            <Sparkles size={20} className="text-accent-blue" />
            Resume ATS &amp; Job Skill Match Analyzer
          </h2>
          <p className="text-[12px] text-muted mt-0.5">
            Analyzed by Target Job Requirements, ATS Points Breakdown, and Interview Readiness.
          </p>
        </div>

        {/* Target Job Requirement Selector */}
        <div className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border">
          <Briefcase size={16} className="text-accent-blue" />
          <span className="text-[12px] font-semibold text-text whitespace-nowrap">Target Job:</span>
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="bg-surface text-text text-[12px] font-medium border border-border rounded-lg px-2.5 py-1 focus:outline-none focus:border-accent-blue"
          >
            {TARGET_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchAnalysis(selectedRole)}>
            Re-Analyze
          </Button>
        </div>
      </div>

      {/* Persistent Active Resume Status Card */}
      {data?.hasResume && (
        <Card className="p-4 bg-accent-blue/5 border border-accent-blue/30 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13.5px] font-bold text-text">Active Parsed Resume Attached</h4>
                  <Badge color="green" size="xs">Saved &amp; Active</Badge>
                  <Badge color="blue" size="xs">Role: {selectedRole}</Badge>
                </div>
                <p className="text-[11.5px] text-muted mt-0.5">
                  Your active resume is saved in your profile and analyzed against <strong className="text-text">{selectedRole}</strong> requirements.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[13px] font-bold text-accent-green block">Job Match: {jobMatchPct}%</span>
                <span className="text-[11px] text-muted block">ATS Points: {atsScore}/100</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReplaceForm(o => !o)}
                icon={Upload}
              >
                {showReplaceForm ? 'Cancel Replace' : 'Change / Update Resume'}
              </Button>
            </div>
          </div>

          {/* Expandable Preview of Active Resume Text */}
          {data?.resumeText && (
            <div className="border-t border-accent-blue/20 pt-2">
              <button
                onClick={() => setShowPreviewText(p => !p)}
                className="text-[11.5px] font-medium text-accent-blue hover:underline flex items-center gap-1"
              >
                {showPreviewText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showPreviewText ? 'Hide Parsed Resume Text' : 'View Parsed Resume Text Preview'}
              </button>
              {showPreviewText && (
                <div className="mt-2 bg-surface p-3 rounded-lg border border-border text-[11px] text-muted max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                  {data.resumeText}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Upload/Paste Form (Shown if no active resume OR user clicks "Change / Update Resume") */}
      {(!data?.hasResume || showReplaceForm) && (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="text-[14px] font-bold text-text flex items-center gap-2">
              <Upload size={16} className="text-accent-blue" />
              Upload New Resume or Paste Text
            </h3>
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab('upload')}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                  tab === 'upload' ? 'bg-accent-blue/15 text-accent-blue' : 'text-muted hover:text-text'
                }`}
              >
                File Upload (PDF / DOCX)
              </button>
              <button
                onClick={() => setTab('paste')}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                  tab === 'paste' ? 'bg-accent-blue/15 text-accent-blue' : 'text-muted hover:text-text'
                }`}
              >
                Paste Resume Text
              </button>
            </div>
          </div>

          {tab === 'upload' ? (
            <div>
              <p className="text-[12px] text-muted mb-3">
                Select your resume (PDF, DOC, DOCX, TXT up to 10MB). It will be stored as your active resume and analyzed against <strong className="text-text">{selectedRole}</strong>.
              </p>
              <label className="border-2 border-dashed border-border hover:border-accent-blue/60 bg-surface hover:bg-card rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all">
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
                <FileText size={28} className="text-accent-blue mb-1.5" />
                <p className="text-[12.5px] font-medium text-text">
                  {file ? file.name : 'Click to choose or drop resume file here'}
                </p>
                <span className="text-[11px] text-muted mt-0.5">PDF, DOC, DOCX, TXT up to 10MB</span>
              </label>
            </div>
          ) : (
            <div>
              <p className="text-[12px] text-muted mb-2">
                Paste your full resume text below (Summary, Skills, Experience, Education):
              </p>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste full resume text here..."
                rows={5}
                className="w-full bg-surface border border-border rounded-xl p-3 text-[12px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
              />
            </div>
          )}

          {error && <p className="text-[12px] text-accent-red mt-2">{error}</p>}

          <div className="mt-4 flex justify-end">
            {tab === 'upload' ? (
              <Button variant="primary" loading={uploading} disabled={!file} onClick={handleUpload} icon={Upload}>
                Upload &amp; Analyze for {selectedRole}
              </Button>
            ) : (
              <Button variant="primary" loading={uploading} disabled={!pastedText.trim()} onClick={handleTextAnalyze} icon={Sparkles}>
                Analyze Text for {selectedRole}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Top Analytics Row: Job Requirement Skill Match + ATS Total Points Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Job Requirement Skill Coverage */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-[13px] font-semibold text-text mb-1">Skill Match for Job Requirement</h4>
          <span className="text-[11px] font-medium text-accent-blue mb-3">{selectedRole}</span>
          <KpiRing
            value={jobMatchPct}
            color={jobMatchPct >= 75 ? '#10B981' : jobMatchPct >= 50 ? '#F59E0B' : '#EF4444'}
            size="lg"
          />
          <Badge
            color={jobMatchPct >= 75 ? 'green' : jobMatchPct >= 50 ? 'amber' : 'red'}
            size="sm"
            className="mt-4"
          >
            {jobMatchPct >= 75 ? 'High Skill Alignment' : jobMatchPct >= 50 ? 'Moderate Skill Coverage' : 'Skills Gap Detected'}
          </Badge>
          <span className="text-[11px] text-muted mt-2">
            {analysis.requiredSkillsFound?.length || 0} / {(analysis.requiredSkillsFound?.length || 0) + (analysis.missingKeywords?.length || 0)} core skills present
          </span>
        </Card>

        {/* Card 2: Overall ATS Score */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h4 className="text-[13px] font-semibold text-text mb-1">Total ATS Points Score</h4>
          <span className="text-[11px] text-muted mb-3">Overall Resume Audit</span>
          <KpiRing
            value={atsScore}
            color={atsScore >= 75 ? '#10B981' : atsScore >= 50 ? '#F59E0B' : '#EF4444'}
            size="lg"
          />
          <Badge
            color={atsScore >= 75 ? 'green' : atsScore >= 50 ? 'amber' : 'red'}
            size="sm"
            className="mt-4"
          >
            {atsScore >= 75 ? 'ATS Optimized (75+ pts)' : atsScore >= 50 ? 'Moderate ATS Score' : 'Needs Optimization (<50 pts)'}
          </Badge>
          <span className="text-[11px] text-muted mt-2">{analysis.wordCount || 0} total words parsed</span>
        </Card>

        {/* Card 3: Experience Profile Tier */}
        <Card className={`p-6 border ${tier.bg} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className={tier.color} />
              <h3 className={`text-[13px] font-bold ${tier.color}`}>Experience Profile</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{tier.icon}</span>
              <div>
                <p className="text-[14px] font-bold text-text">{tier.label}</p>
                <p className="text-[11px] text-muted">{tier.sublabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border/50 pt-3 mt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Target Role:</span>
              <span className="font-semibold text-text">{selectedRole}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Action Verbs:</span>
              <span className="font-semibold text-accent-green">{analysis.actionWordsCount || 0} words</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Sections Found:</span>
              <span className="font-semibold text-accent-blue">{analysis.sectionsFound?.length || 0} / 8</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── ATS Points Breakdown Audit Scorecard (100 Pts Breakdown) ─── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-text flex items-center gap-2">
              <BarChart2 size={18} className="text-accent-blue" />
              ATS Points Breakdown Scorecard
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              Granular scoring breakdown out of 100 maximum ATS points across 5 evaluation parameters.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[16px] font-extrabold text-accent-blue">{atsScore} / 100</span>
            <span className="text-[10px] text-muted block">Points Earned</span>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(atsBreakdown).map(([key, item]) => {
            const pct = Math.round((item.earned / item.max) * 100);
            return (
              <div key={key} className="bg-surface p-3.5 rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-text flex items-center gap-2">
                    {item.pass ? (
                      <CheckCircle size={14} className="text-accent-green flex-shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-accent-amber flex-shrink-0" />
                    )}
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">{item.earned} / {item.max} pts</span>
                    <Badge color={item.pass ? 'green' : 'amber'} size="xs">
                      {item.pass ? 'Passed' : 'Improve'}
                    </Badge>
                  </div>
                </div>

                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 70 ? 'bg-accent-green' : pct >= 40 ? 'bg-accent-amber' : 'bg-accent-red'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted leading-relaxed">
                  {item.details}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Skill Match Breakdown for User Target Job Requirement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Matched Required Skills */}
        <Card className="p-5">
          <h3 className="text-[13px] font-bold text-text mb-3 flex items-center gap-1.5">
            <CheckCircle size={16} className="text-accent-green" />
            Skills Matched for {selectedRole} ({analysis.requiredSkillsFound?.length || 0})
          </h3>
          {analysis.requiredSkillsFound?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.requiredSkillsFound.map(skill => (
                <Badge key={skill} color="green" size="sm">✓ {skill}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted">No core required skills found for {selectedRole} in resume.</p>
          )}
        </Card>

        {/* Missing Required Skills for Target Job Requirement */}
        <Card className="p-5 border border-accent-amber/30">
          <h3 className="text-[13px] font-bold text-accent-amber mb-3 flex items-center gap-1.5">
            <Target size={16} className="text-accent-amber" />
            Missing Skills for {selectedRole} ({analysis.missingKeywords?.length || 0})
          </h3>
          {analysis.missingKeywords?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.missingKeywords.map(keyword => (
                <span
                  key={keyword}
                  className="bg-accent-amber/10 border border-accent-amber/30 text-accent-amber px-2 py-0.5 rounded text-[11px] font-medium"
                >
                  + Add {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-accent-green font-medium">All essential skills present for {selectedRole}!</p>
          )}
        </Card>

        {/* Bonus High-Value Skills */}
        <Card className="p-5 bg-gradient-to-b from-card to-accent-purple/5 border border-accent-purple/30">
          <h3 className="text-[13px] font-bold text-accent-purple mb-3 flex items-center gap-1.5">
            <Star size={16} className="text-accent-amber fill-accent-amber" />
            Bonus Technologies Extracted ({analysis.bonusSkillsFound?.length || 0})
          </h3>
          {analysis.bonusSkillsFound?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.bonusSkillsFound.map(skill => (
                <Badge key={skill} color="purple" size="sm">★ {skill}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted">Add specialized tools (AWS, Docker, Microservices) for extra recruiter appeal.</p>
          )}
        </Card>
      </div>

      {/* Interview Readiness Progression */}
      <Card className="p-6 bg-gradient-to-b from-card to-accent-purple/5 border border-accent-purple/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-accent-purple" />
            <div>
              <h3 className="text-[14px] font-bold text-text">
                Technical Interview Readiness Action Plan
              </h3>
              <p className="text-[11px] text-muted">
                Current Interview Score: <strong className="text-accent-purple">{interviewScore}%</strong> — target 80%+ to clear technical interview screenings.
              </p>
            </div>
          </div>
          <Link to="/interview">
            <Button variant="purple" size="sm" icon={ArrowRight}>
              Practice in Coding Playground
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-xl border border-border">
            <p className="text-[11px] font-bold text-accent-blue uppercase tracking-wide mb-2 flex items-center gap-1">
              <Code2 size={12} /> 1. DSA Topics to Progress
            </p>
            <ul className="space-y-1.5 text-[11.5px] text-text">
              {missingDsa.map(topic => (
                <li key={topic} className="flex items-start gap-1.5">
                  <span className="text-accent-blue font-bold">•</span>
                  <span>Practice <strong className="text-text">{topic}</strong> problems</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-border">
            <p className="text-[11px] font-bold text-accent-purple uppercase tracking-wide mb-2 flex items-center gap-1">
              <TrendingUp size={12} /> 2. System Design Concepts
            </p>
            <ul className="space-y-1.5 text-[11.5px] text-text">
              {missingSysDesign.map(concept => (
                <li key={concept} className="flex items-start gap-1.5">
                  <span className="text-accent-purple font-bold">•</span>
                  <span>Add <strong className="text-text">{concept}</strong> keywords</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-border">
            <p className="text-[11px] font-bold text-accent-amber uppercase tracking-wide mb-2 flex items-center gap-1">
              <Award size={12} /> 3. Behavioral Phrases
            </p>
            <ul className="space-y-1.5 text-[11.5px] text-text">
              {missingBehavioral.map(phrase => (
                <li key={phrase} className="flex items-start gap-1.5">
                  <span className="text-accent-amber font-bold">•</span>
                  <span>Include statement: <em className="text-muted">"{phrase}"</em></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Strengths & Actionable Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strengths */}
        <Card className="p-6">
          <h3 className="text-[14px] font-semibold text-text mb-3 flex items-center gap-2">
            <Award size={16} className="text-accent-green" />
            Resume Strengths
          </h3>
          <ul className="space-y-2">
            {(analysis.strengths || []).length > 0 ? (
              analysis.strengths.map((s, i) => (
                <li key={i} className="text-[12px] text-text flex items-start gap-2">
                  <CheckCircle size={14} className="text-accent-green flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))
            ) : (
              <li className="text-[12px] text-muted">Upload your resume to see strengths.</li>
            )}
          </ul>
        </Card>

        {/* Action Items */}
        <Card className="p-6">
          <h3 className="text-[14px] font-semibold text-text mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-accent-purple" />
            Optimization Recommendations
          </h3>
          <ul className="space-y-2">
            {(analysis.improvements || []).length > 0 ? (
              analysis.improvements.map((tip, i) => (
                <li key={i} className="text-[12px] text-text flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0 mt-1.5" />
                  <span>{tip}</span>
                </li>
              ))
            ) : (
              <li className="text-[12px] text-muted">No improvements needed at this time!</li>
            )}
          </ul>
        </Card>

        {/* Experience-Tier Insights */}
        <Card className="p-6 bg-gradient-to-b from-card to-accent-blue/5 border border-accent-blue/20">
          <h3 className="text-[14px] font-semibold text-accent-blue mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-accent-blue" />
            {tier.label} Insights
          </h3>
          <ul className="space-y-2">
            {(analysis.experienceInsights || []).length > 0 ? (
              analysis.experienceInsights.map((insight, i) => (
                <li key={i} className="text-[11.5px] text-text flex items-start gap-2">
                  <span className="text-accent-blue flex-shrink-0 mt-0.5 font-bold text-[10px]">{i + 1}.</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))
            ) : (
              <li className="text-[12px] text-muted">Upload your resume to receive personalized experience-based insights.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
