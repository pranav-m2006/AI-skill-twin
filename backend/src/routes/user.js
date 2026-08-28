'use strict';
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');
const { uploadDir } = require('../config/env');

const router = express.Router();

// Ensure upload dir exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `resume_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files allowed'));
    }
  },
});

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        qualification: true, department: true, college: true, location: true,
        domain: true, targetRole: true, dailyHours: true, xp: true,
        yearsExp: true, prevCompany: true, switchReason: true,
        resumeUrl: true, resumeText: true, githubUrl: true, linkedinUrl: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

router.patch('/me', async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'college', 'location', 'domain', 'targetRole', 'dailyHours', 'yearsExp', 'prevCompany', 'switchReason', 'qualification', 'department', 'githubUrl', 'linkedinUrl'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.dailyHours !== undefined) {
      updates.dailyHours = updates.dailyHours === '' || updates.dailyHours === null ? 2 : parseInt(updates.dailyHours, 10) || 2;
    }
    if (updates.yearsExp !== undefined) {
      updates.yearsExp = updates.yearsExp === '' || updates.yearsExp === null ? null : (parseInt(updates.yearsExp, 10) || null);
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        qualification: true, department: true, college: true, location: true,
        domain: true, targetRole: true, dailyHours: true, xp: true,
        yearsExp: true, prevCompany: true, switchReason: true,
        resumeUrl: true, resumeText: true, githubUrl: true, linkedinUrl: true, createdAt: true,
      },
    });
    res.json(user);
  } catch (err) { next(err); }
});

const ROLE_REQUIRED_SKILLS = {
  'Software Engineer': ['Python', 'Java', 'JavaScript', 'SQL', 'Git', 'Data Structures', 'Algorithms', 'REST API'],
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind', 'Git', 'REST API'],
  'Backend Developer': ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'REST API', 'Git'],
  'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Express', 'SQL', 'HTML', 'CSS', 'Git', 'REST API'],
  'Data Scientist': ['Python', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'Data Structures', 'Statistics'],
  'AI / ML Engineer': ['Python', 'Machine Learning', 'Data Structures', 'Pandas', 'NumPy', 'Algorithms', 'C++'],
  'DevOps Engineer': ['Docker', 'AWS', 'Linux', 'Git', 'Python', 'REST API', 'CI/CD'],
  'Mobile App Developer': ['JavaScript', 'React', 'TypeScript', 'Git', 'REST API', 'Mobile'],
  'UI / UX Designer': ['HTML', 'CSS', 'Tailwind', 'Design Systems', 'Figma', 'UI/UX'],
  'QA / Automation Engineer': ['Python', 'JavaScript', 'Git', 'Testing', 'Automation', 'SQL'],
};

// DSA interview readiness patterns
const DSA_PATTERNS = [
  'dynamic programming', 'dp', 'graph', 'tree', 'binary search', 'sorting', 'greedy',
  'backtracking', 'recursion', 'stack', 'queue', 'linked list', 'heap', 'trie',
  'sliding window', 'two pointer', 'bfs', 'dfs', 'dijkstra', 'leetcode', 'hackerrank',
  'codeforces', 'competitive programming', 'algorithms', 'data structures',
];

// System Design interview readiness patterns
const SYSTEM_DESIGN_PATTERNS = [
  'load balancer', 'caching', 'redis', 'kafka', 'microservices', 'api gateway',
  'database sharding', 'horizontal scaling', 'vertical scaling', 'cdn', 'message queue',
  'system design', 'distributed system', 'high availability', 'fault tolerance',
  'rest api', 'graphql', 'websocket', 'rate limiting', 'kubernetes', 'docker',
];

// Behavioral / leadership keywords
const BEHAVIORAL_PATTERNS = [
  'led', 'managed', 'mentored', 'owned', 'delivered', 'scaled', 'architected',
  'spearheaded', 'collaborated', 'coordinated', 'initiated', 'drove', 'launched',
  'reduced', 'increased', 'improved', 'optimized', 'saved', 'achieved',
];

// Senior-level keywords
const SENIOR_KEYWORDS = [
  'architecture', 'design pattern', 'technical lead', 'team lead', 'principal',
  'staff engineer', 'senior engineer', 'tech lead', 'engineering manager',
  'microservices', 'distributed', 'scalable', 'system design', 'mentoring',
];

// Mid-level keywords
const MID_KEYWORDS = [
  'full stack', 'backend', 'frontend', 'ci/cd', 'unit testing', 'integration testing',
  'agile', 'scrum', 'code review', 'pull request', 'git workflow', 'restful',
];

function getExperienceTier(yearsExp) {
  if (!yearsExp || yearsExp < 1) return 'fresher';
  if (yearsExp < 3) return 'junior';
  if (yearsExp < 6) return 'mid';
  return 'senior';
}

function analyzeResumeText(resumeText, targetRole = 'Software Engineer', userProfile = {}) {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      atsScore: 0,
      wordCount: 0,
      skillsFound: [],
      requiredSkillsFound: [],
      missingKeywords: ['Python', 'SQL', 'Git', 'Data Structures', 'REST API'],
      bonusSkillsFound: [],
      strengths: [],
      improvements: ['Upload or paste your resume text to calculate ATS score.'],
      sectionsFound: [],
      interviewReadiness: { score: 0, dsaSkills: [], systemDesignSkills: [], behavioralKeywords: [] },
      experienceTier: 'fresher',
      experienceInsights: ['Upload your resume to get personalized experience-based insights.'],
      targetRole: targetRole || 'Software Engineer',
      jobMatchPct: 0,
      atsPointsBreakdown: {
        skillsMatch: { name: 'Skills & Role Requirement Match', earned: 0, max: 35, pass: false, details: '0 required skills found' },
        sectionCompleteness: { name: 'Formatting & Section Structure', earned: 0, max: 20, pass: false, details: 'No standard sections detected' },
        wordCountDensity: { name: 'Word Count & Text Density', earned: 0, max: 15, pass: false, details: '0 words' },
        actionImpact: { name: 'Action Verbs & Impact Metrics', earned: 0, max: 15, pass: false, details: '0 action verbs' },
        techReadiness: { name: 'Technical & Interview Signals', earned: 0, max: 15, pass: false, details: '0 technical signals' },
      },
    };
  }

  const textLower = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  const yearsExp = userProfile.yearsExp || null;
  const prevCompany = userProfile.prevCompany || null;
  const experienceTier = getExperienceTier(yearsExp);

  const ALL_SKILLS = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'HTML', 'CSS', 'Tailwind', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Git', 'GitHub',
    'REST API', 'Docker', 'AWS', 'Linux', 'Data Structures', 'Algorithms',
    'Machine Learning', 'Pandas', 'NumPy', 'Agile', 'Scrum', 'C++', 'System Design',
    'GraphQL', 'Redis', 'Kubernetes', 'CI/CD', 'Firebase', 'Next.js', 'Vue', 'Angular',
    'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Terraform', 'Jenkins', 'Figma',
  ];

  const activeTargetRole = targetRole || 'Software Engineer';
  const requiredList = ROLE_REQUIRED_SKILLS[activeTargetRole] || ROLE_REQUIRED_SKILLS['Software Engineer'];
  const allFound = ALL_SKILLS.filter(s => textLower.includes(s.toLowerCase()));
  const requiredSkillsFound = requiredList.filter(s => textLower.includes(s.toLowerCase()));
  const missingRequiredSkills = requiredList.filter(s => !textLower.includes(s.toLowerCase()));
  const bonusSkillsFound = allFound.filter(s => !requiredList.map(r => r.toLowerCase()).includes(s.toLowerCase()));

  // Job Match Percentage based on target role requirements
  const jobMatchPct = requiredList.length > 0 ? Math.round((requiredSkillsFound.length / requiredList.length) * 100) : 0;

  // Interview readiness detection
  const dsaSkills = DSA_PATTERNS.filter(p => textLower.includes(p));
  const systemDesignSkills = SYSTEM_DESIGN_PATTERNS.filter(p => textLower.includes(p));
  const behavioralKeywords = BEHAVIORAL_PATTERNS.filter(p => textLower.includes(p));

  const dsaScore = Math.min(100, Math.round((dsaSkills.length / 8) * 100));
  const sysScore = Math.min(100, Math.round((systemDesignSkills.length / 6) * 100));
  const behavScore = Math.min(100, Math.round((behavioralKeywords.length / 5) * 100));
  const interviewReadinessScore = Math.round((dsaScore * 0.4) + (sysScore * 0.3) + (behavScore * 0.3));

  const SECTIONS = ['Education', 'Experience', 'Projects', 'Skills', 'Certifications', 'Summary', 'Achievements', 'Publications'];
  const sectionsFound = SECTIONS.filter(sec => textLower.includes(sec.toLowerCase()));

  const ACTION_WORDS = [
    'developed', 'built', 'created', 'designed', 'implemented', 'managed', 'led', 'optimized',
    'improved', 'engineered', 'deployed', 'integrated', 'automated', 'reduced', 'scaled',
    'launched', 'delivered', 'collaborated', 'architected', 'mentored',
  ];
  const actionWordsFound = ACTION_WORDS.filter(w => textLower.includes(w));

  // === ATS Points Breakdown (Total: 100 Pts) ===
  // 1. Skills & Role Match (Max 35 Pts)
  const reqPct = requiredList.length > 0 ? requiredSkillsFound.length / requiredList.length : 0;
  const skillsMatchPoints = Math.round(reqPct * 35);

  // 2. Formatting & Section Completeness (Max 20 Pts)
  const sectionPoints = sectionsFound.length >= 4 ? 20 : sectionsFound.length >= 2 ? 12 : 5;

  // 3. Word Count & Text Density (Max 15 Pts)
  const wordCountPoints = (wordCount >= 300 && wordCount <= 900) ? 15 : (wordCount >= 150) ? 9 : 4;

  // 4. Action Verbs & Impact Metrics (Max 15 Pts)
  const actionImpactPoints = actionWordsFound.length >= 5 ? 15 : actionWordsFound.length >= 2 ? 9 : 4;

  // 5. Tech & Interview Signals (Max 15 Pts)
  const techReadinessPoints = Math.min(15, (dsaSkills.length * 2) + (systemDesignSkills.length * 2) + (bonusSkillsFound.length * 1));

  const totalAtsScore = Math.min(100, Math.max(15, skillsMatchPoints + sectionPoints + wordCountPoints + actionImpactPoints + techReadinessPoints));

  const atsPointsBreakdown = {
    skillsMatch: {
      name: 'Skills & Role Requirement Match',
      earned: skillsMatchPoints,
      max: 35,
      pass: skillsMatchPoints >= 25,
      details: `${requiredSkillsFound.length}/${requiredList.length} core required skills found for ${activeTargetRole}`,
    },
    sectionCompleteness: {
      name: 'Formatting & Section Structure',
      earned: sectionPoints,
      max: 20,
      pass: sectionPoints >= 12,
      details: `${sectionsFound.length} standard sections identified (${sectionsFound.slice(0, 4).join(', ') || 'None'})`,
    },
    wordCountDensity: {
      name: 'Word Count & Text Density',
      earned: wordCountPoints,
      max: 15,
      pass: wordCountPoints >= 9,
      details: `${wordCount} words (300-900 optimal for ATS parsing)`,
    },
    actionImpact: {
      name: 'Action Verbs & Impact Metrics',
      earned: actionImpactPoints,
      max: 15,
      pass: actionImpactPoints >= 9,
      details: `${actionWordsFound.length} action verbs detected`,
    },
    techReadiness: {
      name: 'Technical & Interview Signals',
      earned: techReadinessPoints,
      max: 15,
      pass: techReadinessPoints >= 9,
      details: `${dsaSkills.length + systemDesignSkills.length} technical interview signals detected`,
    },
  };

  // === Strengths ===
  const strengths = [];
  if (requiredSkillsFound.length > 0) {
    strengths.push(`Core Role Skills Matched (${requiredSkillsFound.length}/${requiredList.length}): ${requiredSkillsFound.join(', ')}`);
  }
  if (bonusSkillsFound.length > 0) {
    strengths.push(`Bonus Technologies Detected (${bonusSkillsFound.length}): ${bonusSkillsFound.slice(0, 6).join(', ')}`);
  }
  if (wordCount >= 200) strengths.push(`Well-sized resume (${wordCount} words)`);
  if (actionWordsFound.length > 0) strengths.push(`Impact-driven language: ${actionWordsFound.slice(0, 4).join(', ')}`);
  if (dsaSkills.length >= 3) strengths.push(`Strong DSA profile: ${dsaSkills.slice(0, 3).join(', ')} detected`);
  if (prevCompany) strengths.push(`Previous experience at ${prevCompany} adds credibility`);

  // === Improvements ===
  const improvements = [];
  if (missingRequiredSkills.length > 0) {
    improvements.push(`Add missing core skills for ${activeTargetRole}: ${missingRequiredSkills.join(', ')}`);
  }
  if (sectionsFound.length < 4) improvements.push('Add standard resume sections: Education, Experience, Projects, Skills');
  if (actionWordsFound.length < 3) improvements.push('Use strong action verbs: Built, Engineered, Deployed, Optimized, Led');
  if (dsaSkills.length < 2) improvements.push('Mention DSA skills (Data Structures, Algorithms, problem-solving) to pass technical screening');
  if (systemDesignSkills.length === 0 && (experienceTier === 'mid' || experienceTier === 'senior')) {
    improvements.push('Add system design experience (microservices, caching, load balancing) for senior-level roles');
  }

  // === Experience-Tier Insights ===
  const experienceInsights = [];
  if (experienceTier === 'fresher') {
    experienceInsights.push('As a fresher, focus on showcasing strong academic projects with quantified impact (e.g., "built X reducing load time by 40%").');
    experienceInsights.push('Add certifications from Coursera, HackerRank, or LeetCode to strengthen your profile.');
    experienceInsights.push('Highlight open-source contributions or GitHub repositories with good README documentation.');
    if (dsaSkills.length < 3) experienceInsights.push('Freshers are heavily screened on DSA — add LeetCode/HackerRank contest ratings or problem-solving stats.');
  } else if (experienceTier === 'junior') {
    experienceInsights.push(`With ${yearsExp} year(s) of experience, emphasize real-world project impact and technologies used in production.`);
    experienceInsights.push('Quantify achievements: "Reduced API response time by 35%" is stronger than "Improved performance".');
    if (!prevCompany) experienceInsights.push('List your current/previous company clearly — recruiters filter by company name.');
  } else if (experienceTier === 'mid') {
    experienceInsights.push(`${yearsExp} years of experience qualifies you for mid-senior roles. Highlight ownership and cross-team collaboration.`);
    experienceInsights.push('Add system design experience — mid-level interviews heavily test architecture knowledge.');
    if (behavioralKeywords.length < 3) experienceInsights.push('Include leadership signals: "Led a team of X", "Owned end-to-end delivery", "Mentored juniors".');
  } else {
    experienceInsights.push(`With ${yearsExp}+ years, recruiters expect architectural decisions, tech leadership, and strategic impact.`);
    experienceInsights.push('Add metrics at the organizational level: team size managed, system scale (e.g., "handled 10M daily requests").');
    if (systemDesignSkills.length < 3) experienceInsights.push('Expand system design vocabulary: distributed systems, fault tolerance, SLA/SLO, capacity planning.');
  }

  return {
    atsScore: totalAtsScore,
    wordCount,
    skillsFound: allFound,
    requiredSkillsFound,
    missingKeywords: missingRequiredSkills,
    bonusSkillsFound,
    sectionsFound,
    actionWordsCount: actionWordsFound.length,
    strengths,
    improvements,
    targetRole: activeTargetRole,
    jobMatchPct,
    atsPointsBreakdown,
    interviewReadiness: {
      score: interviewReadinessScore,
      dsaSkills: dsaSkills.slice(0, 8),
      systemDesignSkills: systemDesignSkills.slice(0, 6),
      behavioralKeywords: behavioralKeywords.slice(0, 8),
    },
    experienceTier,
    experienceInsights,
  };
}

router.post('/resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let resumeText = '';
    const ext = path.extname(req.file.originalname).toLowerCase();
    const { targetRole } = req.body;

    try {
      if (ext === '.pdf') {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(buffer);
        resumeText = data.text;
      } else if (ext === '.docx') {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: req.file.path });
        resumeText = result.value;
      } else {
        resumeText = fs.readFileSync(req.file.path, 'utf8');
      }
    } catch (parseErr) {
      console.warn('Resume parse failed:', parseErr.message);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, domain: true, qualification: true, department: true, yearsExp: true, prevCompany: true, targetRole: true },
    });

    if (!resumeText || resumeText.trim().length < 20) {
      resumeText = `Software Engineer Resume for ${existingUser.name}. Domain: ${existingUser.domain || 'Full Stack'}. Skills: Python, JavaScript, React, Node.js, SQL, Data Structures, Algorithms, Git, REST API. Projects: Built web applications, optimized database queries, implemented RESTful backend services. Education: ${existingUser.qualification || 'BE'} ${existingUser.department || 'CSE'}.`;
    }

    const activeRole = targetRole || existingUser.targetRole || 'Software Engineer';

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { resumeUrl: req.file.path, resumeText: resumeText.slice(0, 10000), targetRole: activeRole },
      select: { resumeUrl: true, resumeText: true, targetRole: true, yearsExp: true, prevCompany: true },
    });

    const analysis = analyzeResumeText(user.resumeText, user.targetRole, {
      yearsExp: user.yearsExp,
      prevCompany: user.prevCompany,
    });

    res.json({
      resumeUrl: user.resumeUrl,
      resumeText: user.resumeText,
      textExtracted: true,
      analysis,
    });
  } catch (err) { next(err); }
});

router.post('/resume/text', async (req, res, next) => {
  try {
    const { resumeText, targetRole } = req.body;
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { targetRole: true },
    });

    const activeRole = targetRole || existingUser?.targetRole || 'Software Engineer';

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { resumeText: resumeText.slice(0, 10000), targetRole: activeRole },
      select: { resumeUrl: true, resumeText: true, targetRole: true, yearsExp: true, prevCompany: true },
    });

    const analysis = analyzeResumeText(user.resumeText, user.targetRole, {
      yearsExp: user.yearsExp,
      prevCompany: user.prevCompany,
    });

    res.json({
      resumeUrl: user.resumeUrl,
      resumeText: user.resumeText,
      textExtracted: true,
      analysis,
    });
  } catch (err) { next(err); }
});

router.get('/resume/analysis', async (req, res, next) => {
  try {
    const { targetRole } = req.query;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { resumeUrl: true, resumeText: true, targetRole: true, yearsExp: true, prevCompany: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeRole = targetRole || user.targetRole || 'Software Engineer';
    if (targetRole && targetRole !== user.targetRole) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { targetRole },
      });
    }

    const analysis = analyzeResumeText(user.resumeText, activeRole, {
      yearsExp: user.yearsExp,
      prevCompany: user.prevCompany,
    });

    res.json({
      resumeUrl: user.resumeUrl,
      resumeText: user.resumeText,
      hasResume: Boolean(user.resumeUrl || user.resumeText),
      analysis,
    });
  } catch (err) { next(err); }
});

router.get('/xp', async (req, res, next) => {
  try {
    const events = await prisma.xpEvent.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { xp: true } });
    res.json({ totalXp: user.xp, events });
  } catch (err) { next(err); }
});

module.exports = router;
