'use strict';
/**
 * chatbotController.js — PlaceMate AI
 *
 * TF-IDF retrieval fallback always on.
 * If LLM API key is configured, uses it for richer, professionally formatted responses.
 * Never hard-fails if LLM is unavailable.
 */
const prisma = require('../config/prisma');
const { findSimilarDocuments } = require('../services/matchingService');
const { llm } = require('../config/env');

// Knowledge base for TF-IDF fallback retrieval — formatted for readability
const KB = [
  {
    q: 'how do i start my roadmap',
    a: '**How to Start Your Roadmap**\n\n1. Go to the **Roadmap** page from the sidebar.\n2. Click **"Generate Roadmap"** button.\n3. Choose your **domain** (e.g. Full Stack, DSA, Python).\n4. Set your **study level** and **daily hours**.\n5. Your personalized multi-week plan will be created instantly!\n\n> Tip: The more accurate your skill profile, the better your roadmap will be tailored to your gaps.',
  },
  {
    q: 'what is streak',
    a: '**About Your Streak**\n\nYour streak counts **consecutive days** where you complete at least **70%** of your planned tasks.\n\n- **How to maintain it**: Complete today\'s roadmap tasks before midnight.\n- **Badges earned**: At 3, 7, 14, 30, 50, 100, and 365-day milestones.\n- **XP bonus**: Each streak day earns you extra XP toward leveling up.\n\n> Missing a day resets your streak, so plan consistently!',
  },
  {
    q: 'how is readiness score calculated',
    a: '**Readiness Score Breakdown**\n\nYour readiness score is computed from four weighted components:\n\n| Component | Weight |\n|-----------|--------|\n| Skill Proficiencies | 30% |\n| Roadmap Progress | 30% |\n| Aptitude Accuracy | 25% |\n| Assessment Scores | 15% |\n\n> Visit the **Skill Twin** page for a detailed breakdown of your current score.',
  },
  {
    q: 'how to improve skill gap',
    a: '**Closing Your Skill Gaps**\n\nHere are the most effective strategies:\n\n1. **Follow your roadmap daily** — it\'s built specifically from your detected skill gaps.\n2. **Focus on weak areas** shown in the Skill Twin radar chart (skills below 40%).\n3. **Practice aptitude questions** daily — each correct answer boosts your score.\n4. **Update your skills** manually on the Skill Twin page after completing courses or projects.\n\n> Consistency beats intensity — 1 hour daily beats a 7-hour weekend session.',
  },
  {
    q: 'what is skill twin',
    a: '**What is Skill Twin?**\n\nYour **AI Skill Twin** is a computed profile of your:\n\n- **Current skills** and proficiency levels (0–100%)\n- **Strengths** (skills ≥ 70%)\n- **Gaps** (skills < 40%)\n- **Readiness Score** for placement\n\nIt powers your **roadmap generation**, **job match %**, and **interview prep suggestions**. Keep it updated for the most accurate recommendations.',
  },
  {
    q: 'how does job matching work',
    a: '**How Job Matching Works**\n\nJob match % is calculated using **TF-IDF cosine similarity** between:\n\n- Your skills and resume text\n- Each job\'s requirements and description\n\n**To improve your match scores:**\n1. Upload or update your resume on the Profile page.\n2. Keep your Skill Twin profile up to date.\n3. Set your target role accurately in your profile.\n\n> Higher skill coverage + better resume keywords = higher match %.',
  },
  {
    q: 'how do i earn badges',
    a: '**Badge Earning Guide**\n\nBadges are awarded **automatically** when you hit milestones:\n\n- **Streak Badges**: 3, 7, 14, 30, 50, 100, 365 consecutive days\n- **XP Badges**: Reaching XP thresholds (500, 1000, 2500 XP)\n- **Roadmap Badges**: Completing 25%, 50%, 75%, 100% of your plan\n- **Aptitude Badges**: Correct answer streaks and total submissions\n\n> Check your badge collection on the Dashboard!',
  },
  {
    q: 'what is xp',
    a: '**XP (Experience Points) System**\n\nXP is earned by completing activities on PlaceMate AI:\n\n| Activity | XP Earned |\n|----------|-----------|\n| Complete a roadmap day | +50 XP |\n| Complete an assessment day | +150 XP |\n| Correct aptitude answer | +10 XP |\n| Earning a badge | Bonus XP |\n\n> XP unlocks badges and shows your overall platform engagement level.',
  },
  {
    q: 'how do i upload resume',
    a: '**Uploading Your Resume**\n\n1. Go to the **Resume Analyzer** page from the sidebar.\n2. Click **"File Upload (PDF / DOCX)"** tab.\n3. Select your resume file (PDF, DOC, or DOCX, up to 10MB).\n4. Click **"Analyze Uploaded Resume"**.\n\n**Alternatively**, use the **"Paste Resume Text"** tab to paste your resume content directly for instant analysis.\n\n> Your resume is used to compute your **ATS score**, **job match %**, and **skill gap insights**.',
  },
  {
    q: 'what domains are supported',
    a: '**Supported Learning Domains**\n\nPlaceMate AI currently supports roadmaps for:\n\n- **Programming**: DSA, Python, Java, JavaScript, C++\n- **Web**: React, Node.js, Full Stack, HTML/CSS\n- **Data**: SQL, Machine Learning, Data Science\n- **DevOps**: Docker, AWS, CI/CD\n- **Other**: Cybersecurity, Aptitude & Reasoning\n\n> Choose your domain during profile setup or update it on the Profile page.',
  },
];

async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: req.user.id, role: 'USER', content },
    });

    let reply;

    // Try LLM if configured
    if (llm.enabled) {
      try {
        reply = await callLLM(content, req.user.id);
      } catch (llmErr) {
        console.warn('[Chatbot] LLM failed, falling back to TF-IDF:', llmErr.message);
        reply = tfIdfFallback(content);
      }
    } else {
      reply = tfIdfFallback(content);
    }

    // Save assistant message
    const assistantMsg = await prisma.chatMessage.create({
      data: { userId: req.user.id, role: 'ASSISTANT', content: reply },
    });

    res.json({ message: assistantMsg });
  } catch (err) { next(err); }
}

function tfIdfFallback(query) {
  const docs = KB.map(k => k.q + ' ' + k.a);
  const matches = findSimilarDocuments(query, docs, 1);
  if (matches.length > 0 && matches[0].score > 0.05) {
    return KB[matches[0].idx].a;
  }
  return '**PlaceMate AI Career Coach**\n\nI\'m here to help with your placement preparation journey!\n\nYou can ask me about:\n- **Roadmap** — how to start and follow your study plan\n- **Streak** — how daily streaks work and badge rewards\n- **Skill Twin** — understanding your skill gaps and readiness score\n- **Job Matching** — how to improve your job match percentage\n- **Resume** — ATS scoring and optimization tips\n- **Interview Prep** — technical and behavioral preparation strategies\n\n> Just type your question and I\'ll guide you!';
}

async function callLLM(content, userId) {
  if (!llm.groqKey) throw new Error('Groq API key not configured');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true, domain: true, targetRole: true, yearsExp: true, college: true },
  });

  const recentHistory = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  const formattedHistory = recentHistory.reverse().map(m => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }));

  const experienceLevel = user?.yearsExp
    ? user.yearsExp >= 5 ? 'Senior (5+ years)' : user.yearsExp >= 2 ? 'Mid-level (2-4 years)' : 'Junior (1-2 years)'
    : 'Fresher (0-1 years)';

  const systemPrompt = `You are PlaceMate AI Career Coach, an expert AI mentor for student developers and placement aspirants.

User Profile:
- Name: ${user?.name || 'Student'}
- Target Role: ${user?.targetRole || 'Software Engineer'}
- Domain: ${user?.domain || 'Full Stack'}
- Experience: ${experienceLevel}
- College: ${user?.college || 'Not specified'}

RESPONSE FORMAT RULES (follow strictly):
1. Always structure responses with clear sections using **Bold Headers**.
2. Use numbered lists (1. 2. 3.) for sequential steps or processes.
3. Use bullet points (- item) for features, options, or unordered facts.
4. Use markdown tables (| col | col |) for comparisons or structured data.
5. Highlight key terms with **bold text**.
6. Keep responses concise (max 300 words) but complete and professional.
7. End with a practical tip or next action when relevant using > blockquote format.
8. Never output a wall of plain text — always use structured formatting.

Focus areas: placement strategy, technical interview prep, DSA roadmaps, career growth, resume optimization, and skill development.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content },
  ];

  const candidateModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${llm.groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.65,
          max_tokens: 750,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Groq model ${model} HTTP ${response.status}: ${errorText}`);
        console.warn(`[Groq AI Warning] Model ${model} failed, trying next fallback:`, errorText);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (e) {
      lastError = e;
      console.warn(`[Groq AI Warning] Exception on model ${model}:`, e.message);
    }
  }

  throw lastError || new Error('All Groq models failed');
}

async function getHistory(req, res, next) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json(messages);
  } catch (err) { next(err); }
}

module.exports = { sendMessage, getHistory };
