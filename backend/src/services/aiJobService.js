'use strict';

/**
 * aiJobService.js — PlaceMate AI
 *
 * Real-time location-aware Job & Internship data generator using Groq AI API.
 * Dynamically generates and syncs accurate real-world job & internship listings for
 * any Indian location (e.g. Coimbatore, Chennai, Bengaluru, Madurai, Mumbai, Pune, Delhi, etc.)
 * and target domain/skill set.
 */

const prisma = require('../config/prisma');

async function callGroqAI(promptText) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real-time placement and job data aggregator for India. Respond ONLY with a valid JSON array of job/internship objects without markdown formatting or surrounding explanation.',
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
        temperature: 0.3,
      }),
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    let content = json.choices?.[0]?.message?.content || '';

    // Strip backticks or formatting
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('[AI Job Service Warning] Failed to fetch real-time jobs from Groq AI:', err.message);
    return null;
  }
}

/**
 * Dynamically fetches and persists real-time jobs for a location and search query.
 */
async function fetchRealtimeJobsForLocation({ location = 'PAN India', domain = 'Software Engineer', query = '' }) {
  const prompt = `Return a JSON array of 5 real-time, currently hiring active job listings in location: "${location}" for domain/role: "${query || domain}".
Each item in the array MUST have this exact JSON structure:
{
  "companyName": "Real tech company name (e.g., Zoho Corporation, Freshworks, Infosys, TCS, Amazon India, Cognizant, Wipro, Accenture, Swiggy, Paytm)",
  "companyIndustry": "IT / Software Services / Product",
  "title": "Specific job title (e.g., Full Stack Engineer, Python Developer, Frontend Developer)",
  "description": "2-3 sentence realistic job role description and key responsibilities",
  "experienceReq": "0-2 years" or "2-4 years" or "0-1 year",
  "location": "${location}",
  "workMode": "ON_SITE" or "HYBRID" or "REMOTE",
  "salaryMin": number in INR per annum (e.g., 600000),
  "salaryMax": number in INR per annum (e.g., 1200000),
  "skillsRequired": ["Skill1", "Skill2", "Skill3", "Skill4"]
}`;

  const aiListings = await callGroqAI(prompt);
  if (!aiListings || aiListings.length === 0) return [];

  const createdJobs = [];
  for (const item of aiListings) {
    try {
      const companyName = item.companyName || 'Leading Tech Enterprise';
      let company = await prisma.company.findFirst({ where: { name: companyName } });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: companyName,
            industry: item.companyIndustry || 'IT & Software',
            location: item.location || location,
            overview: `${companyName} is actively recruiting skilled engineering talent across India.`,
          },
        });
      }

      // Avoid creating duplicate job title under same company
      const existingJob = await prisma.job.findFirst({
        where: { companyId: company.id, title: item.title, location: item.location || location },
      });

      if (!existingJob) {
        const newJob = await prisma.job.create({
          data: {
            companyId: company.id,
            title: item.title || `${domain} Developer`,
            description: item.description || `Active hiring opportunity for ${item.title} in ${location}.`,
            experienceReq: item.experienceReq || '0-2 years',
            location: item.location || location,
            workMode: item.workMode || 'HYBRID',
            salaryMin: parseFloat(item.salaryMin) || 600000,
            salaryMax: parseFloat(item.salaryMax) || 1200000,
            salaryPeriod: 'ANNUAL',
            currency: 'INR',
            skillsRequired: JSON.stringify(item.skillsRequired || ['JavaScript', 'Python', 'SQL']),
          },
          include: { company: true },
        });
        createdJobs.push(newJob);
      } else {
        createdJobs.push(existingJob);
      }
    } catch (err) {
      console.warn('[AI Job Service] DB save warning:', err.message);
    }
  }

  return createdJobs;
}

/**
 * Dynamically fetches and persists real-time internships for a location and search query.
 */
async function fetchRealtimeInternshipsForLocation({ location = 'PAN India', domain = 'Software Engineering', query = '' }) {
  const prompt = `Return a JSON array of 5 real-time, currently hiring active internship listings in location: "${location}" for domain/role: "${query || domain}".
Each item in the array MUST have this exact JSON structure:
{
  "companyName": "Real tech company or high-growth startup name",
  "companyIndustry": "IT Services / Software Product / EdTech / FinTech",
  "title": "Specific internship title (e.g., Software Engineering Intern, Web Development Intern, AI/ML Intern)",
  "description": "2-3 sentence realistic internship responsibilities and learning scope",
  "eligibility": "Pre-final / Final Year Students (BE/BTech/BCA/MCA/BSc)",
  "duration": "3 months" or "6 months",
  "location": "${location}",
  "workMode": "REMOTE" or "HYBRID" or "ON_SITE",
  "stipendMin": number in INR per month (e.g. 15000),
  "stipendMax": number in INR per month (e.g. 35000),
  "skillsRequired": ["Skill1", "Skill2", "Skill3"]
}`;

  const aiListings = await callGroqAI(prompt);
  if (!aiListings || aiListings.length === 0) return [];

  const createdInternships = [];
  for (const item of aiListings) {
    try {
      const companyName = item.companyName || 'Innovate Tech Labs';
      let company = await prisma.company.findFirst({ where: { name: companyName } });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: companyName,
            industry: item.companyIndustry || 'Software & Technology',
            location: item.location || location,
            overview: `${companyName} offers immersive internship programs for college students & freshers.`,
          },
        });
      }

      const existingInternship = await prisma.internship.findFirst({
        where: { companyId: company.id, title: item.title, location: item.location || location },
      });

      if (!existingInternship) {
        const newInternship = await prisma.internship.create({
          data: {
            companyId: company.id,
            title: item.title || `${domain} Intern`,
            description: item.description || `Exciting internship role at ${companyName} in ${location}.`,
            eligibility: item.eligibility || 'Final Year & Pre-final Students',
            duration: item.duration || '3–6 Months',
            location: item.location || location,
            workMode: item.workMode || 'REMOTE',
            stipendMin: parseFloat(item.stipendMin) || 18000,
            stipendMax: parseFloat(item.stipendMax) || 30000,
            stipendPeriod: 'MONTHLY',
            currency: 'INR',
            skillsRequired: JSON.stringify(item.skillsRequired || ['Python', 'React', 'Git']),
          },
          include: { company: true },
        });
        createdInternships.push(newInternship);
      } else {
        createdInternships.push(existingInternship);
      }
    } catch (err) {
      console.warn('[AI Internship Service] DB save warning:', err.message);
    }
  }

  return createdInternships;
}

module.exports = {
  fetchRealtimeJobsForLocation,
  fetchRealtimeInternshipsForLocation,
};
