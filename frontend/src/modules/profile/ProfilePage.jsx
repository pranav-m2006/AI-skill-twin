import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, Save, CheckCircle, Flame, FileText, Sparkles, BookOpen, Clock, Globe } from 'lucide-react';
import api from '../../shared/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import Badge from '../../shared/components/Badge';
import DropdownSelect from '../../shared/components/DropdownSelect';

const QUALIFICATIONS = ['BE', 'BTech', 'BSc', 'BCA', 'ME', 'MTech', 'MCA', 'MSc', 'Other'];
const DEPARTMENTS = ['CSE', 'IT', 'AI&DS', 'AIML', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
const DOMAINS = ['DSA', 'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'Full Stack', 'SQL', 'Machine Learning', 'Data Science', 'Cybersecurity', 'Aptitude'];
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
const TARGET_ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'AI / ML Engineer', 'DevOps Engineer', 'Mobile App Developer', 'UI / UX Designer', 'QA / Automation Engineer', 'Product Manager', 'Other'];
const DAILY_HOURS = [1, 2, 3, 4, 5, 6, 8];

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    qualification: '',
    department: '',
    college: '',
    location: '',
    domain: '',
    targetRole: '',
    dailyHours: 2,
    yearsExp: '',
    prevCompany: '',
    switchReason: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [uRes, bRes, sRes] = await Promise.allSettled([
        api.get('/user/me'),
        api.get('/streak'),
        api.get('/streak'),
      ]);

      const u = uRes.value?.data || authUser || {};
      setUser(u);
      setForm({
        name: u.name || '',
        phone: u.phone || '',
        qualification: u.qualification || '',
        department: u.department || '',
        college: u.college || '',
        location: u.location || '',
        domain: u.domain || '',
        targetRole: u.targetRole || '',
        dailyHours: u.dailyHours || 2,
        yearsExp: u.yearsExp || '',
        prevCompany: u.prevCompany || '',
        switchReason: u.switchReason || '',
        githubUrl: u.githubUrl || '',
        linkedinUrl: u.linkedinUrl || '',
      });

      if (bRes.value?.data?.badges) setBadges(bRes.value.data.badges);
      if (sRes.value?.data) setStreak(sRes.value.data);
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const setVal = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const { data: updated } = await api.patch('/user/me', {
        ...form,
        dailyHours: parseFloat(form.dailyHours),
        yearsExp: form.yearsExp ? parseInt(form.yearsExp) : undefined,
      });
      setUser(updated);
      setMsg('🎉 Profile updated successfully!');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  const level = Math.floor((user?.xp || 0) / 200) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Profile Card */}
      <Card className="p-6 bg-gradient-to-r from-card to-surface border border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-blue/20 border-2 border-accent-blue/40 flex items-center justify-center text-accent-blue text-2xl font-bold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-text flex items-center gap-2">
                {user?.name}
                <Badge color="blue" size="xs">Lvl {level}</Badge>
              </h2>
              <p className="text-[12px] text-muted flex items-center gap-1.5 mt-0.5">
                <Mail size={12} /> {user?.email} • {user?.role || 'Student'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.targetRole && <Badge color="purple" size="xs"><Briefcase size={10} className="inline mr-1" />{user.targetRole}</Badge>}
                {user?.location && <Badge color="amber" size="xs"><MapPin size={10} className="inline mr-1" />{user.location}</Badge>}
                {user?.domain && <Badge color="green" size="xs"><BookOpen size={10} className="inline mr-1" />{user.domain}</Badge>}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 bg-bg/50 p-4 rounded-xl border border-border/80">
            <div className="text-center px-3">
              <p className="text-[18px] font-bold text-accent-amber flex items-center justify-center gap-1">
                <Flame size={16} /> {streak?.currentStreak || 0}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Streak</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center px-3">
              <p className="text-[18px] font-bold text-accent-purple flex items-center justify-center gap-1">
                <Award size={16} /> {user?.xp || 0}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">XP</p>
            </div>
          </div>
        </div>
      </Card>

      {msg && (
        <div className="bg-accent-green/10 border border-accent-green/30 p-3.5 rounded-xl text-[13px] text-accent-green flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} /> {msg}
        </div>
      )}

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 p-3.5 rounded-xl text-[13px] text-accent-red animate-fade-in">
          {error}
        </div>
      )}

      {/* Main Profile Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 space-y-5">
          <h3 className="text-[15px] font-bold text-text flex items-center gap-2 border-b border-border pb-3">
            <User size={16} className="text-accent-blue" />
            Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-muted block mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInput}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-muted block mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleInput}
                placeholder="+91 99999 00000"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DropdownSelect
              id="profile-location"
              label="Location"
              options={LOCATIONS}
              value={form.location}
              onChange={v => setVal('location', v)}
              placeholder="Select location"
            />
            <DropdownSelect
              id="profile-target-role"
              label="Target Job Role"
              options={TARGET_ROLES}
              value={form.targetRole}
              onChange={v => setVal('targetRole', v)}
              placeholder="Select target role"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DropdownSelect
              id="profile-qualification"
              label="Qualification"
              options={QUALIFICATIONS}
              value={form.qualification}
              onChange={v => setVal('qualification', v)}
              placeholder="Select qualification"
            />
            <DropdownSelect
              id="profile-department"
              label="Department"
              options={DEPARTMENTS}
              value={form.department}
              onChange={v => setVal('department', v)}
              placeholder="Select department"
            />
          </div>

          <DropdownSelect
            id="profile-college"
            label="College / Institution"
            options={INSTITUTIONS}
            value={form.college}
            onChange={v => setVal('college', v)}
            placeholder="Select college / institution"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DropdownSelect
              id="profile-domain"
              label="Primary Study Domain"
              options={DOMAINS}
              value={form.domain}
              onChange={v => setVal('domain', v)}
              placeholder="Select study domain"
            />
            <DropdownSelect
              id="profile-daily-hours"
              label="Daily Study Commitment"
              options={DAILY_HOURS.map(h => ({ value: h, label: `${h} hours/day` }))}
              value={form.dailyHours}
              onChange={v => setVal('dailyHours', v)}
              placeholder="Select hours"
            />
          </div>

          {user?.role === 'EXPERIENCED' && (
            <div className="space-y-4 pt-3 border-t border-border">
              <h4 className="text-[13px] font-bold text-text flex items-center gap-1.5">
                <Briefcase size={14} className="text-accent-purple" /> Work Experience Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsExp"
                    value={form.yearsExp}
                    onChange={handleInput}
                    placeholder="e.g. 3"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted block mb-1">Previous Company</label>
                  <input
                    type="text"
                    name="prevCompany"
                    value={form.prevCompany}
                    onChange={handleInput}
                    placeholder="Company name"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional GitHub & LinkedIn links */}
          <div className="space-y-4 pt-3 border-t border-border">
            <h4 className="text-[13px] font-bold text-text flex items-center gap-1.5">
              <Globe size={14} className="text-accent-blue" /> Professional Links (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-muted block mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  name="githubUrl"
                  value={form.githubUrl}
                  onChange={handleInput}
                  placeholder="https://github.com/username"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                  id="profile-github-url"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted block mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={form.linkedinUrl}
                  onChange={handleInput}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent-blue"
                  id="profile-linkedin-url"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              variant="primary"
              loading={saving}
              onClick={handleSave}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </Card>

        {/* Right side: Resume & Badges summary */}
        <div className="space-y-6">
          {/* Resume Summary */}
          <Card className="p-5">
            <h3 className="text-[14px] font-bold text-text mb-3 flex items-center gap-2">
              <FileText size={16} className="text-accent-blue" />
              Resume ATS Profile
            </h3>
            {user?.resumeUrl || user?.resumeText ? (
              <div className="space-y-3">
                <div className="bg-surface p-3 rounded-lg border border-border text-[12px] text-text flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-accent-green" /> Resume Processed
                  </span>
                  <Badge color="green" size="xs">Active</Badge>
                </div>
                <a
                  href="/resume"
                  className="block text-center w-full py-2 bg-accent-blue/15 text-accent-blue rounded-lg text-[12px] font-semibold hover:bg-accent-blue/25 transition-colors"
                >
                  View ATS Analysis & Extracted Skills →
                </a>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-[12px] text-muted">No resume uploaded yet.</p>
                <a
                  href="/resume"
                  className="inline-block py-2 px-4 bg-accent-blue text-white rounded-lg text-[12px] font-semibold hover:bg-accent-blue/90 transition-colors"
                >
                  Upload Resume Now
                </a>
              </div>
            )}
          </Card>

          {/* Achievements Summary */}
          <Card className="p-5">
            <h3 className="text-[14px] font-bold text-text mb-3 flex items-center gap-2">
              <Award size={16} className="text-accent-amber" />
              Unlocked Badges ({badges.length})
            </h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {badges.slice(0, 4).map((b, idx) => (
                  <div key={b.id || b.badgeId || `badge-${idx}`} className="bg-surface p-2.5 rounded-lg border border-border text-center">
                    <div className="text-xl mb-1">{b.icon || '🏅'}</div>
                    <p className="text-[11px] font-bold text-text truncate">{b.name || b.badgeId}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted text-center py-3">
                Complete daily tasks to unlock milestone badges!
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
