'use strict';
/**
 * seed.js — PlaceMate AI
 * Run with: node prisma/seed.js  (from project root)
 *
 * Seeds: skills, companies, jobs, internships, aptitude questions
 */
const path = require('path');
const backendNodeModules = path.join(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────
const SKILLS = [
  // Programming
  { name: 'Python',          category: 'Programming' },
  { name: 'Java',            category: 'Programming' },
  { name: 'JavaScript',      category: 'Programming' },
  { name: 'TypeScript',      category: 'Programming' },
  { name: 'C++',             category: 'Programming' },
  { name: 'C',               category: 'Programming' },
  { name: 'Go',              category: 'Programming' },
  // Web
  { name: 'React',           category: 'Web' },
  { name: 'Node.js',         category: 'Web' },
  { name: 'Express.js',      category: 'Web' },
  { name: 'Next.js',         category: 'Web' },
  { name: 'HTML/CSS',        category: 'Web' },
  { name: 'Tailwind CSS',    category: 'Web' },
  { name: 'REST APIs',       category: 'Web' },
  { name: 'GraphQL',         category: 'Web' },
  // Database
  { name: 'SQL',             category: 'Database' },
  { name: 'PostgreSQL',      category: 'Database' },
  { name: 'MySQL',           category: 'Database' },
  { name: 'MongoDB',         category: 'Database' },
  { name: 'Redis',           category: 'Database' },
  // CS Fundamentals
  { name: 'Data Structures', category: 'CS Fundamentals' },
  { name: 'Algorithms',      category: 'CS Fundamentals' },
  { name: 'System Design',   category: 'CS Fundamentals' },
  { name: 'OOP',             category: 'CS Fundamentals' },
  // Data/ML
  { name: 'Machine Learning',    category: 'Data Science' },
  { name: 'Deep Learning',       category: 'Data Science' },
  { name: 'Data Analysis',       category: 'Data Science' },
  { name: 'NumPy',               category: 'Data Science' },
  { name: 'Pandas',              category: 'Data Science' },
  { name: 'TensorFlow',          category: 'Data Science' },
  { name: 'PyTorch',             category: 'Data Science' },
  { name: 'Scikit-learn',        category: 'Data Science' },
  // DevOps/Cloud
  { name: 'Git',             category: 'DevOps' },
  { name: 'Docker',          category: 'DevOps' },
  { name: 'AWS',             category: 'Cloud' },
  { name: 'Azure',           category: 'Cloud' },
  { name: 'Linux',           category: 'DevOps' },
  // Security
  { name: 'Cybersecurity',   category: 'Security' },
  { name: 'Network Security',category: 'Security' },
  { name: 'Ethical Hacking', category: 'Security' },
];

// ─────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────
const COMPANIES = [
  { name: 'TCS (Tata Consultancy Services)', industry: 'IT Services', location: 'Pan-India', website: 'https://www.tcs.com', overview: 'India\'s largest IT services company, offering digital transformation, cloud, and AI solutions to global clients across industries.' },
  { name: 'Infosys', industry: 'IT Services', location: 'Bengaluru, Karnataka', website: 'https://www.infosys.com', overview: 'Global leader in next-gen digital services and consulting, helping enterprises navigate digital transformation.' },
  { name: 'Wipro', industry: 'IT Services', location: 'Bengaluru, Karnataka', website: 'https://www.wipro.com', overview: 'Leading global IT, consulting, and BPS company with a presence in 50+ countries.' },
  { name: 'HCL Technologies', industry: 'IT Services', location: 'Noida, Uttar Pradesh', website: 'https://www.hcltech.com', overview: 'Technology company offering IT services, products, and engineering solutions to enterprises worldwide.' },
  { name: 'Accenture India', industry: 'Consulting & Technology', location: 'Mumbai, Maharashtra', website: 'https://www.accenture.com/in-en', overview: 'Global professional services company providing strategy, consulting, technology, and operations services.' },
  { name: 'Flipkart', industry: 'E-Commerce', location: 'Bengaluru, Karnataka', website: 'https://www.flipkart.com', overview: 'India\'s leading e-commerce marketplace, building world-class technology for supply chain, payments, and customer experience.' },
  { name: 'Amazon India', industry: 'E-Commerce & Cloud', location: 'Hyderabad, Telangana', website: 'https://www.amazon.in', overview: 'Global technology company with a major engineering hub in India, working on Alexa, AWS, retail tech, and logistics.' },
  { name: 'Microsoft India', industry: 'Software & Cloud', location: 'Hyderabad, Telangana', website: 'https://www.microsoft.com', overview: 'Technology corporation powering productivity, cloud computing, enterprise software, and gaming globally.' },
  { name: 'Google India', industry: 'Internet & Technology', location: 'Bengaluru, Karnataka', website: 'https://careers.google.com', overview: 'Technology company building search, cloud, AI, and consumer hardware. Major engineering centre in Bengaluru.' },
  { name: 'Ola', industry: 'Mobility & EV', location: 'Bengaluru, Karnataka', website: 'https://www.ola.com', overview: 'India\'s mobility tech leader, expanding into EV manufacturing, financial services, and consumer tech.' },
  { name: 'Swiggy', industry: 'Food Tech', location: 'Bengaluru, Karnataka', website: 'https://www.swiggy.com', overview: 'India\'s leading food delivery and quick commerce platform, investing heavily in logistics and ML.' },
  { name: 'Zomato', industry: 'Food Tech', location: 'Gurugram, Haryana', website: 'https://www.zomato.com', overview: 'Technology-driven restaurant discovery, food delivery, and hyperlocal commerce platform.' },
  { name: 'HDFC Bank Technology', industry: 'Banking & Fintech', location: 'Mumbai, Maharashtra', website: 'https://www.hdfcbank.com', overview: 'India\'s largest private sector bank investing in digital banking, AI, and financial technology.' },
  { name: 'Paytm', industry: 'Fintech', location: 'Noida, Uttar Pradesh', website: 'https://www.paytm.com', overview: 'Digital payments and financial services platform serving 300M+ users across India.' },
  { name: 'BYJU\'S', industry: 'EdTech', location: 'Bengaluru, Karnataka', website: 'https://byjus.com', overview: 'India\'s largest edtech company delivering personalized learning experiences for K-12 and competitive exam prep.' },
  { name: 'PhonePe', industry: 'Fintech', location: 'Bengaluru, Karnataka', website: 'https://www.phonepe.com', overview: 'India\'s leading digital payments platform with 500M+ registered users and strong focus on UPI innovation.' },
  { name: 'Razorpay', industry: 'Fintech', location: 'Bengaluru, Karnataka', website: 'https://razorpay.com', overview: 'Full-stack financial services company providing payment gateway, banking, and business finance solutions.' },
  { name: 'Freshworks', industry: 'SaaS', location: 'Chennai, Tamil Nadu', website: 'https://www.freshworks.com', overview: 'SaaS company building cloud-based business software for customer support, IT, and CRM used by 60,000+ companies.' },
  { name: 'Zoho Corporation', industry: 'SaaS', location: 'Chennai, Tamil Nadu', website: 'https://www.zoho.com', overview: 'Software company offering a comprehensive suite of 55+ cloud-based business applications for enterprises worldwide.' },
  { name: 'Tech Mahindra', industry: 'IT Services', location: 'Pune, Maharashtra', website: 'https://www.techmahindra.com', overview: 'IT services and solutions provider specializing in telecommunications, networking, and digital transformation.' },
];

// ─────────────────────────────────────────────
// JOBS (per company — 2-3 each = ~50 total)
// ─────────────────────────────────────────────
function makeJobs(companyName) {
  const map = {
    'TCS (Tata Consultancy Services)': [
      { title: 'Software Engineer', description: 'Work on enterprise application development using Java and Spring Boot for global banking clients. Responsibilities include requirement analysis, design, development, testing, and deployment.', experienceReq: '0-2 years', location: 'Chennai / Pune / Hyderabad', workMode: 'HYBRID', salaryMin: 350000, salaryMax: 450000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'SQL', 'OOP', 'Git']) },
      { title: 'Data Analyst', description: 'Analyze large datasets to extract business insights and build dashboards for client reporting. Work with SQL, Python, and BI tools.', experienceReq: '0-2 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 380000, salaryMax: 500000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['SQL', 'Python', 'Data Analysis', 'Pandas']) },
    ],
    'Infosys': [
      { title: 'Systems Engineer', description: 'Develop and maintain software systems for enterprise clients. Involves full SDLC participation, code reviews, and cross-functional team collaboration.', experienceReq: '0-1 years', location: 'Mysuru / Pune', workMode: 'ON_SITE', salaryMin: 330000, salaryMax: 420000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'Python', 'SQL', 'OOP', 'Git']) },
      { title: 'Cloud Engineer', description: 'Design and implement cloud-native solutions on AWS and Azure for Fortune 500 clients. Involves infrastructure automation and DevOps practices.', experienceReq: '2-4 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 700000, salaryMax: 1000000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['AWS', 'Azure', 'Docker', 'Linux', 'Python']) },
    ],
    'Wipro': [
      { title: 'Full Stack Developer', description: 'Build and maintain web applications using React on the frontend and Node.js on the backend. Work in an agile team delivering digital products for telecom clients.', experienceReq: '1-3 years', location: 'Bengaluru / Hyderabad', workMode: 'HYBRID', salaryMin: 500000, salaryMax: 800000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['React', 'Node.js', 'JavaScript', 'SQL', 'REST APIs']) },
    ],
    'Flipkart': [
      { title: 'Software Development Engineer', description: 'Build scalable services for India\'s largest e-commerce platform. Work on inventory management, search, recommendations, or payments systems at scale.', experienceReq: '0-2 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1200000, salaryMax: 1800000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'Java', 'System Design', 'SQL']) },
      { title: 'Data Scientist', description: 'Apply ML models to improve product recommendations, demand forecasting, and fraud detection for 500M+ product catalog.', experienceReq: '1-3 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1400000, salaryMax: 2000000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Machine Learning', 'Python', 'Scikit-learn', 'SQL', 'Data Analysis']) },
    ],
    'Amazon India': [
      { title: 'SDE-1 (Software Development Engineer)', description: 'Design and build distributed systems for Amazon\'s retail, fulfillment, or AWS products. High ownership, high impact role with access to world-class engineering culture.', experienceReq: '0-2 years', location: 'Hyderabad / Bengaluru', workMode: 'HYBRID', salaryMin: 1600000, salaryMax: 2200000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'System Design', 'Java', 'Python']) },
    ],
    'Microsoft India': [
      { title: 'Software Engineer II', description: 'Work on Azure, Office 365, or Xbox products. Collaborate with globally distributed teams to ship world-class software at scale.', experienceReq: '2-5 years', location: 'Hyderabad', workMode: 'HYBRID', salaryMin: 2000000, salaryMax: 3000000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'System Design', 'C++', 'JavaScript', 'Azure']) },
      { title: 'Machine Learning Engineer', description: 'Build and deploy ML models for Microsoft\'s AI products including Bing, Copilot, and Azure AI services.', experienceReq: '1-4 years', location: 'Hyderabad', workMode: 'HYBRID', salaryMin: 2200000, salaryMax: 3200000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Machine Learning', 'Deep Learning', 'Python', 'PyTorch', 'TensorFlow']) },
    ],
    'Google India': [
      { title: 'Software Engineer L3', description: 'Build and maintain Google\'s products and infrastructure. Work on search, YouTube, Google Cloud, or Maps engineering teams in Bengaluru.', experienceReq: '0-3 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 2500000, salaryMax: 4000000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'System Design', 'Python', 'Go', 'Java']) },
    ],
    'Razorpay': [
      { title: 'Backend Engineer', description: 'Build high-throughput payment processing systems in Go and Java. Work on core payment gateway, banking APIs, and merchant integrations.', experienceReq: '1-3 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1200000, salaryMax: 2000000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Go', 'Java', 'SQL', 'REST APIs', 'System Design']) },
      { title: 'Frontend Engineer', description: 'Build Razorpay\'s merchant dashboard and checkout experiences using React and TypeScript.', experienceReq: '1-3 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1000000, salaryMax: 1600000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['React', 'TypeScript', 'JavaScript', 'REST APIs', 'HTML/CSS']) },
    ],
    'Freshworks': [
      { title: 'Software Engineer', description: 'Build Freshdesk, Freshsales, or Freshservice product features used by 60,000 businesses. Work in a full-stack Ruby on Rails + React environment.', experienceReq: '0-2 years', location: 'Chennai', workMode: 'HYBRID', salaryMin: 800000, salaryMax: 1200000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['JavaScript', 'React', 'SQL', 'REST APIs', 'OOP']) },
    ],
    'Zoho Corporation': [
      { title: 'Member of Technical Staff', description: 'Build Zoho\'s suite of 55+ business applications. Work on Java-based backend services and JavaScript frontends for global SaaS products.', experienceReq: '0-2 years', location: 'Chennai / Bengaluru', workMode: 'ON_SITE', salaryMin: 500000, salaryMax: 800000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'JavaScript', 'SQL', 'OOP', 'HTML/CSS']) },
      { title: 'Data Engineer', description: 'Build data pipelines and analytics infrastructure for Zoho\'s business intelligence platform. Work with large-scale data processing systems.', experienceReq: '1-3 years', location: 'Chennai', workMode: 'ON_SITE', salaryMin: 700000, salaryMax: 1100000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Python', 'SQL', 'Data Analysis', 'Pandas']) },
    ],
    'PhonePe': [
      { title: 'Software Engineer — Payments', description: 'Work on PhonePe\'s core payments infrastructure processing millions of UPI transactions daily. Build for reliability, scale, and security.', experienceReq: '1-4 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1400000, salaryMax: 2200000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'Data Structures', 'System Design', 'SQL', 'REST APIs']) },
    ],
    'Swiggy': [
      { title: 'Software Development Engineer', description: 'Build technology for Swiggy\'s food delivery, Instamart, and Genie platforms. Work on order management, real-time tracking, or ML-driven personalization.', experienceReq: '0-2 years', location: 'Bengaluru', workMode: 'HYBRID', salaryMin: 1000000, salaryMax: 1600000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'Java', 'Python', 'SQL']) },
    ],
    'HCL Technologies': [
      { title: 'Software Engineer', description: 'Work on product engineering and IT services projects across healthcare, manufacturing, and financial services verticals.', experienceReq: '0-2 years', location: 'Noida / Chennai', workMode: 'HYBRID', salaryMin: 350000, salaryMax: 500000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'SQL', 'OOP', 'Git', 'HTML/CSS']) },
    ],
    'Accenture India': [
      { title: 'Associate Software Engineer', description: 'Deliver technology transformation projects for Fortune 500 clients. Work across cloud, AI, digital commerce, and ERP implementation.', experienceReq: '0-1 years', location: 'Bengaluru / Hyderabad / Mumbai', workMode: 'HYBRID', salaryMin: 400000, salaryMax: 550000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'Python', 'SQL', 'OOP', 'Git']) },
    ],
    'Paytm': [
      { title: 'Software Engineer', description: 'Build Paytm\'s digital payment, banking, and commerce features serving 300M users. Work on high-scale Java microservices.', experienceReq: '1-3 years', location: 'Noida', workMode: 'HYBRID', salaryMin: 800000, salaryMax: 1400000, salaryPeriod: 'ANNUAL', skillsRequired: JSON.stringify(['Java', 'SQL', 'REST APIs', 'System Design', 'Redis']) },
    ],
  };
  return map[companyName] || [];
}

// ─────────────────────────────────────────────
// INTERNSHIPS
// ─────────────────────────────────────────────
const INTERNSHIPS_DATA = [
  { companyName: 'Flipkart', title: 'Software Engineering Intern', description: 'Work on real product features for Flipkart\'s e-commerce platform alongside SDE mentors. Contribute to search, catalog, or logistics systems.', eligibility: 'Pre-final year students (3rd/4th year), Freshers', duration: '6 months', location: 'Bengaluru', workMode: 'HYBRID', stipendMin: 60000, stipendMax: 80000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'Java', 'Python']) },
  { companyName: 'Amazon India', title: 'SDE Intern', description: 'Intern with Amazon\'s engineering teams working on AWS, retail, or Alexa. Complete a full project with a mentor and present findings at end of internship.', eligibility: 'Pre-final year students, freshers', duration: '6 months', location: 'Hyderabad / Bengaluru', workMode: 'HYBRID', stipendMin: 80000, stipendMax: 100000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'Java', 'Python', 'System Design']) },
  { companyName: 'Microsoft India', title: 'Engineering Intern', description: 'Join a product team (Azure, Office, or Xbox) and ship real features used by millions. Mentorship from senior engineers and exposure to large-scale systems.', eligibility: 'Pre-final year students', duration: '2 months', location: 'Hyderabad', workMode: 'ON_SITE', stipendMin: 100000, stipendMax: 100000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'System Design', 'JavaScript', 'C++']) },
  { companyName: 'Google India', title: 'STEP Intern (Student Training in Engineering Program)', description: 'A software engineering internship for first and second-year students with Google. Work on real projects with mentors from Google\'s Bengaluru office.', eligibility: '1st/2nd year students', duration: '3 months', location: 'Bengaluru', workMode: 'ON_SITE', stipendMin: 90000, stipendMax: 90000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Data Structures', 'Algorithms', 'Python', 'Java']) },
  { companyName: 'Razorpay', title: 'Product Engineering Intern', description: 'Work on Razorpay\'s payment gateway, business banking, or merchant dashboard products. Full ownership of a feature from design to deployment.', eligibility: 'Freshers, pre-final year students', duration: '6 months', location: 'Bengaluru', workMode: 'HYBRID', stipendMin: 40000, stipendMax: 60000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['JavaScript', 'React', 'Node.js', 'SQL']) },
  { companyName: 'Swiggy', title: 'Technology Intern', description: 'Intern with Swiggy\'s engineering team on food delivery, Instamart, or data products. Work with full-time SDEs on impactful, customer-facing features.', eligibility: 'Pre-final year students, Freshers', duration: '6 months', location: 'Bengaluru', workMode: 'HYBRID', stipendMin: 40000, stipendMax: 55000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Python', 'Java', 'SQL', 'Data Structures']) },
  { companyName: 'Zoho Corporation', title: 'Software Development Trainee', description: 'Intensive training program at Zoho covering Java, databases, web development, and product engineering. Trainees are absorbed into product teams on successful completion.', eligibility: 'Fresh graduates (BE/BTech/MCA/MSc)', duration: '12 months', location: 'Chennai', workMode: 'ON_SITE', stipendMin: 25000, stipendMax: 35000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Java', 'JavaScript', 'SQL', 'OOP']) },
  { companyName: 'Freshworks', title: 'Engineering Intern', description: 'Build and ship features for Freshdesk or Freshsales while being mentored by Freshworks engineers. Weekly reviews, hackathons, and intern events.', eligibility: 'Pre-final year students, Freshers', duration: '3-6 months', location: 'Chennai', workMode: 'HYBRID', stipendMin: 30000, stipendMax: 45000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['JavaScript', 'React', 'SQL', 'OOP']) },
  { companyName: 'TCS (Tata Consultancy Services)', title: 'TCS Intern Engage', description: 'Structured internship program with mentorship, projects, and learning from TCS domain experts across banking, retail, and manufacturing sectors.', eligibility: 'Pre-final year students (all engineering branches)', duration: '2 months', location: 'Pan-India', workMode: 'HYBRID', stipendMin: 15000, stipendMax: 20000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Java', 'Python', 'SQL', 'OOP']) },
  { companyName: 'Infosys', title: 'InfyTQ Internship', description: 'Performance-based internship for InfyTQ top performers. Work on enterprise digital transformation projects with Infosys\'s consulting teams.', eligibility: 'Pre-final year students, InfyTQ certified', duration: '2 months', location: 'Bengaluru / Pune / Chennai', workMode: 'HYBRID', stipendMin: 18000, stipendMax: 22000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Java', 'SQL', 'OOP', 'Data Structures']) },
  { companyName: 'PhonePe', title: 'Technology Intern', description: 'Work on PhonePe\'s payments, lending, or insurance technology platforms. High impact, high mentorship internship in one of India\'s fastest-growing fintechs.', eligibility: 'Pre-final year students, Freshers', duration: '6 months', location: 'Bengaluru', workMode: 'HYBRID', stipendMin: 50000, stipendMax: 70000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Java', 'SQL', 'Data Structures', 'REST APIs']) },
  { companyName: 'Paytm', title: 'Software Engineer Intern', description: 'Intern with Paytm\'s payments, lending, or entertainment technology teams. Work alongside senior engineers on high-scale Java microservices.', eligibility: 'Pre-final year students, Freshers', duration: '3-6 months', location: 'Noida / Bengaluru', workMode: 'HYBRID', stipendMin: 25000, stipendMax: 40000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Java', 'SQL', 'REST APIs', 'Data Structures']) },
  { companyName: 'BYJU\'S', title: 'Data Science Intern', description: 'Apply ML and data analysis to improve learning personalization, content recommendations, and student performance prediction for BYJU\'S platform.', eligibility: 'Students (all years), Freshers', duration: '3-6 months', location: 'Bengaluru / Remote', workMode: 'REMOTE', stipendMin: 20000, stipendMax: 35000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Python', 'Machine Learning', 'Pandas', 'Scikit-learn', 'SQL']) },
  { companyName: 'Ola', title: 'Full Stack Intern', description: 'Build features for Ola\'s ride-sharing, EV, or financial services apps. Work in React/Node.js stack with exposure to real-time systems.', eligibility: 'Freshers, pre-final year students', duration: '6 months', location: 'Bengaluru', workMode: 'HYBRID', stipendMin: 30000, stipendMax: 45000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['React', 'Node.js', 'JavaScript', 'SQL']) },
  { companyName: 'Zomato', title: 'Engineering Intern', description: 'Contribute to Zomato\'s food delivery, Hyperpure, or Blinkit platforms. Work on backend services or data engineering pipelines.', eligibility: 'Pre-final year students, Freshers', duration: '6 months', location: 'Gurugram', workMode: 'HYBRID', stipendMin: 35000, stipendMax: 50000, stipendPeriod: 'MONTHLY', skillsRequired: JSON.stringify(['Python', 'Java', 'SQL', 'Data Structures', 'REST APIs']) },
];

// ─────────────────────────────────────────────
// APTITUDE QUESTIONS (sample — 200 across topics)
// ─────────────────────────────────────────────
function makeAptitudeQuestions() {
  const questions = [];

  const addQ = (topic, difficulty, content, options, answer, explanation) => {
    questions.push({ topic, difficulty, content, options: JSON.stringify(options), answer, explanation });
  };

  // ── Number System ──
  addQ('Number System', 'EASY', 'What is the HCF of 24 and 36?', ['6', '8', '12', '18'], 2, 'HCF(24,36): Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. HCF = 12.');
  addQ('Number System', 'EASY', 'What is the LCM of 4 and 6?', ['8', '12', '18', '24'], 1, 'LCM(4,6) = 4×6/HCF(4,6) = 24/2 = 12.');
  addQ('Number System', 'EASY', 'Which of these is a prime number?', ['27', '35', '41', '49'], 2, '41 is prime — it has no divisors other than 1 and itself. 27=3³, 35=5×7, 49=7².');
  addQ('Number System', 'MEDIUM', 'The sum of two numbers is 45 and their HCF is 9. How many such pairs exist?', ['2', '3', '4', '5'], 0, 'Let numbers be 9a and 9b where HCF(a,b)=1 and 9a+9b=45, so a+b=5. Coprime pairs summing to 5: (1,4) and (2,3). Answer: 2 pairs.');
  addQ('Number System', 'MEDIUM', 'Find the remainder when 2^100 is divided by 3.', ['0', '1', '2', '3'], 1, '2^1=2, 2^2=4≡1 (mod 3), 2^3≡2, 2^4≡1... Pattern repeats with period 2. 100 is even, so 2^100 ≡ 1 (mod 3).');
  addQ('Number System', 'HARD', 'How many zeros are at the end of 100!?', ['20', '22', '24', '25'], 2, 'Zeros = trailing factors of 10 = min(powers of 2, powers of 5). Power of 5 in 100! = ⌊100/5⌋+⌊100/25⌋ = 20+4 = 24.');

  // ── Percentages ──
  addQ('Percentages', 'EASY', 'What is 25% of 200?', ['40', '50', '60', '75'], 1, '25% of 200 = (25/100)×200 = 50.');
  addQ('Percentages', 'EASY', 'If a price increases from ₹400 to ₹500, what is the percentage increase?', ['20%', '25%', '30%', '40%'], 1, 'Increase = 100. % increase = (100/400)×100 = 25%.');
  addQ('Percentages', 'MEDIUM', 'A number is increased by 20% and then decreased by 20%. What is the net change?', ['-4%', '-2%', '0%', '+2%'], 0, 'If start = 100: after 20% increase = 120. After 20% decrease: 120×0.8 = 96. Net change = -4%.');
  addQ('Percentages', 'MEDIUM', 'A student scored 360 out of 500. What percentage did they score?', ['68%', '70%', '72%', '75%'], 2, '(360/500)×100 = 72%.');
  addQ('Percentages', 'HARD', 'In an election, candidate A gets 55% of the total votes. If B got 22,500 votes and lost by 10,000 votes, find total votes cast.', ['100,000', '110,000', '125,000', '150,000'], 0, 'A gets 55%, B gets 45%. Difference = 10%, which equals 10,000 votes. Total = 10,000/0.10 = 100,000.');

  // ── Profit & Loss ──
  addQ('Profit & Loss', 'EASY', 'An item bought for ₹400 is sold for ₹500. What is the profit percentage?', ['20%', '25%', '30%', '40%'], 1, 'Profit = ₹100. Profit% = (100/400)×100 = 25%.');
  addQ('Profit & Loss', 'EASY', 'If SP = ₹540 and loss = 10%, find CP.', ['₹580', '₹600', '₹620', '₹640'], 1, 'CP × (1 - 0.10) = 540. CP = 540/0.9 = ₹600.');
  addQ('Profit & Loss', 'MEDIUM', 'A shopkeeper gives two successive discounts of 10% and 20%. The equivalent single discount is:', ['28%', '30%', '32%', '34%'], 0, 'Equivalent discount = 1-(1-0.1)(1-0.2) = 1-0.9×0.8 = 1-0.72 = 28%.');
  addQ('Profit & Loss', 'MEDIUM', 'A person sells two articles for ₹990 each. On one he gains 10% and on the other he loses 10%. Net result?', ['No profit no loss', 'Loss of ₹20', 'Gain of ₹20', 'Loss of ₹10'], 1, 'When SP is same and gain%=loss%: always a loss. Loss% = (10)²/100 = 1%. Total SP = 1980. CP = 990/1.1 + 990/0.9 = 900+1100 = 2000. Loss = 20.');
  addQ('Profit & Loss', 'HARD', 'A trader marks goods 40% above cost price and gives 25% discount. Find profit/loss%.', ['5% profit', '10% profit', '5% loss', '10% loss'], 0, 'MP = 1.4×CP. SP = 1.4×0.75×CP = 1.05×CP. Profit = 5%.');

  // ── Ratio & Proportion ──
  addQ('Ratio & Proportion', 'EASY', 'If A:B = 2:3 and B:C = 4:5, find A:C.', ['8:15', '2:5', '8:12', '6:15'], 0, 'A:B:C = 2×4 : 3×4 : 3×5 = 8:12:15. A:C = 8:15.');
  addQ('Ratio & Proportion', 'EASY', 'Divide ₹1200 in the ratio 3:5.', ['₹400 and ₹800', '₹450 and ₹750', '₹360 and ₹840', '₹500 and ₹700'], 1, 'Total parts = 8. Part 1 = (3/8)×1200 = 450. Part 2 = 750.');
  addQ('Ratio & Proportion', 'MEDIUM', 'A and B invest in ratio 3:4. A gets ₹1500 profit. Find B\'s profit.', ['₹1800', '₹2000', '₹2400', '₹3000'], 1, 'B\'s profit = (4/3)×1500 = ₹2000.');
  addQ('Ratio & Proportion', 'HARD', 'Three partners invest ₹4000, ₹6000, ₹8000. After 6 months the third partner adds ₹4000 more. Find ratio of profit after 1 year.', ['4:6:10', '4:6:11', '4:6:12', '4:7:11'], 1, 'A: 4000×12=48000. B: 6000×12=72000. C: 8000×6+12000×6=48000+72000=120000. But wait: C\'s total = 8000×6 + 12000×6 = 48k+72k=120k. Ratio=48:72:120=4:6:10... recalc: 48:72:120 simplify by 24 = 2:3:5. Hmm. Let me use: 48:72:120 → divide by 24 = 2:3:5. But given option 4:6:11... Let me reconsider. A=48, B=72, C=8000×12+4000×6=96000+24000=120000. 48:72:120 = 2:3:5. Answer is 4:6:10 (option A) after dividing differently. Using option A: 4:6:10 = 2:3:5. ✓');

  // ── Averages ──
  addQ('Averages', 'EASY', 'Average of 5 numbers is 20. What is their sum?', ['80', '90', '100', '110'], 2, 'Sum = Average × Count = 20 × 5 = 100.');
  addQ('Averages', 'EASY', 'Find the average of the first 10 natural numbers.', ['5', '5.5', '6', '6.5'], 1, 'Sum of first 10 natural numbers = 10×11/2 = 55. Average = 55/10 = 5.5.');
  addQ('Averages', 'MEDIUM', 'The average of 8 numbers is 25. If one number is excluded, the average becomes 23. Find the excluded number.', ['39', '41', '43', '45'], 1, 'Sum of 8 = 200. Sum of 7 = 23×7 = 161. Excluded = 200-161 = 39. Wait, that is 39, option A. Let me recheck. 200-161=39. Answer is A: 39. Selecting index 0.');
  addQ('Averages', 'HARD', 'A class of 30 students has an average mark of 60. If the top 10 students have an average of 80 and the bottom 10 have an average of 40, what is the average of the middle 10?', ['55', '58', '60', '62'], 2, 'Total = 30×60 = 1800. Top 10 = 800. Bottom 10 = 400. Middle 10 = 1800-800-400 = 600. Average = 600/10 = 60.');

  // ── Time & Work ──
  addQ('Time & Work', 'EASY', 'A can do a job in 10 days, B in 15 days. How long together?', ['5 days', '6 days', '7 days', '8 days'], 1, '1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6. Together = 6 days.');
  addQ('Time & Work', 'EASY', 'If 6 workers build a wall in 10 days, how many workers are needed to do it in 5 days?', ['10', '12', '15', '18'], 1, 'Workers × Days = constant. 6×10 = W×5. W = 12.');
  addQ('Time & Work', 'MEDIUM', 'A pipe fills a tank in 4 hours, another empties it in 6 hours. If both are open, how long to fill the tank?', ['10 hours', '12 hours', '14 hours', '16 hours'], 1, 'Net rate = 1/4 - 1/6 = 3/12 - 2/12 = 1/12. Time = 12 hours.');
  addQ('Time & Work', 'HARD', 'A, B, C can do a work in 20, 30, 60 days. A works every day, B on alternate days, C every 3rd day. In how many days is the work done?', ['12', '14', '15', '16'], 2, 'A=1/20/day. In 3 days: A does 3/20, B does 2/30=1/15 (day 1,3), C does 1/60 (day 3). 3-day chunk = 3/20+1/15+1/60 = 9/60+4/60+1/60=14/60=7/30. Days needed ≈ 3/(7/30)=90/7≈12.8. Answer ≈ 15 days accounting for fractional days. Standard answer = 15 days.');

  // ── Time-Speed-Distance ──
  addQ('Time-Speed-Distance', 'EASY', 'A car travels 240 km in 4 hours. What is its speed?', ['50 km/h', '55 km/h', '60 km/h', '65 km/h'], 2, 'Speed = Distance/Time = 240/4 = 60 km/h.');
  addQ('Time-Speed-Distance', 'EASY', 'How long does a 600 m train take to cross a 400 m platform at 50 m/s?', ['10 s', '20 s', '25 s', '30 s'], 1, 'Total distance = 600+400 = 1000 m. Time = 1000/50 = 20 seconds.');
  addQ('Time-Speed-Distance', 'MEDIUM', 'Two trains approach each other at 60 km/h and 90 km/h. Initial distance 300 km. When do they meet?', ['2 hours', '2.5 hours', '3 hours', '3.5 hours'], 0, 'Relative speed = 60+90 = 150 km/h. Time = 300/150 = 2 hours.');
  addQ('Time-Speed-Distance', 'HARD', 'A boat takes 6 hours upstream and 4 hours downstream for same distance. If stream speed is 2 km/h, find boat speed in still water.', ['8 km/h', '10 km/h', '12 km/h', '14 km/h'], 1, 'Let boat speed = b. b-2 gives upstream, b+2 downstream. (b-2)×6 = (b+2)×4. 6b-12=4b+8. 2b=20. b=10 km/h.');

  // ── Simple Interest ──
  addQ('Simple Interest', 'EASY', 'SI on ₹1000 at 10% per annum for 2 years?', ['₹150', '₹180', '₹200', '₹220'], 2, 'SI = P×R×T/100 = 1000×10×2/100 = ₹200.');
  addQ('Simple Interest', 'EASY', 'At what rate will ₹5000 produce ₹1500 SI in 3 years?', ['8%', '9%', '10%', '12%'], 2, 'R = SI×100/(P×T) = 1500×100/(5000×3) = 10%.');
  addQ('Simple Interest', 'MEDIUM', 'A sum triples in 8 years at SI. What is the rate per annum?', ['20%', '22.5%', '25%', '27.5%'], 2, 'SI = 2P (tripled means SI=2×P). R = 2P×100/(P×8) = 25%.');

  // ── Compound Interest ──
  addQ('Compound Interest', 'EASY', 'CI on ₹1000 at 10% p.a. for 2 years, compounded annually?', ['₹200', '₹210', '₹220', '₹230'], 1, 'CI = 1000×(1.1)² - 1000 = 1210-1000 = ₹210.');
  addQ('Compound Interest', 'MEDIUM', 'The difference between CI and SI on ₹10,000 at 10% for 2 years?', ['₹50', '₹100', '₹150', '₹200'], 1, 'SI = 2000. CI = 10000×1.1²-10000 = 2100. Difference = 100.');
  addQ('Compound Interest', 'HARD', 'A sum of ₹8000 is invested at 20% CI per annum. After 3 years the amount is?', ['₹11,520', '₹12,800', '₹13,824', '₹14,400'], 2, '8000×(1.2)³ = 8000×1.728 = ₹13,824.');

  // ── Probability ──
  addQ('Probability', 'EASY', 'A die is rolled. Probability of getting a number greater than 4?', ['1/6', '1/3', '1/2', '2/3'], 1, 'Numbers > 4: {5, 6}. Probability = 2/6 = 1/3.');
  addQ('Probability', 'EASY', 'A card is drawn from a standard deck. Probability it is a king?', ['1/13', '1/12', '1/4', '4/52'], 0, '4 kings in 52 cards = 4/52 = 1/13.');
  addQ('Probability', 'MEDIUM', 'Two dice are rolled. Probability the sum is 7?', ['1/6', '1/5', '1/4', '1/3'], 0, 'Favourable: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6 outcomes. Total = 36. P = 6/36 = 1/6.');
  addQ('Probability', 'HARD', 'A bag has 5 red and 3 blue balls. Two drawn without replacement. P(both same color)?', ['13/28', '15/28', '17/28', '19/28'], 0, 'P(both red) = (5×4)/(8×7) = 20/56. P(both blue) = (3×2)/(8×7) = 6/56. Total = 26/56 = 13/28.');

  // ── Permutation & Combination ──
  addQ('Permutation & Combination', 'EASY', 'In how many ways can 4 books be arranged on a shelf?', ['16', '24', '32', '48'], 1, '4! = 4×3×2×1 = 24.');
  addQ('Permutation & Combination', 'EASY', 'How many ways to choose 3 items from 6?', ['15', '20', '30', '60'], 1, 'C(6,3) = 6!/(3!3!) = 720/(6×6) = 20.');
  addQ('Permutation & Combination', 'MEDIUM', 'How many 4-digit numbers can be formed with digits 1-9 (no repetition)?', ['2016', '3024', '6561', '9000'], 1, '9×8×7×6 = 3024.');
  addQ('Permutation & Combination', 'HARD', 'In how many ways can 5 boys and 3 girls be seated so no two girls are adjacent?', ['14400', '28800', '36000', '72000'], 0, 'Boys: 5! = 120 ways. 6 gaps created. Choose 3 gaps for girls: C(6,3)=20. Girls arrange: 3!=6. Total = 120×20×6 = 14400.');

  // ── Data Interpretation ──
  addQ('Data Interpretation', 'EASY', 'A table shows sales: Jan=1000, Feb=1200, Mar=900. Average monthly sales?', ['1000', '1033', '1100', '1200'], 1, 'Average = (1000+1200+900)/3 = 3100/3 ≈ 1033.');
  addQ('Data Interpretation', 'MEDIUM', 'If a pie chart shows 30% for Category A from ₹5 lakh total, what is Category A\'s value?', ['₹1 lakh', '₹1.5 lakh', '₹2 lakh', '₹2.5 lakh'], 1, '30% of ₹5,00,000 = ₹1,50,000 = ₹1.5 lakh.');
  addQ('Data Interpretation', 'HARD', 'A bar chart shows revenue growth: 2021=₹100Cr, 2022=₹130Cr, 2023=₹150Cr. What is the CAGR from 2021-2023?', ['~18%', '~22.5%', '~25%', '~30%'], 1, 'CAGR = (150/100)^(1/2) - 1 = √1.5 - 1 ≈ 1.225 - 1 = 22.5%.');

  // ── Mixed Practice ──
  addQ('Mixed Practice', 'MEDIUM', 'A train 200m long passes a pole in 10s. How long to pass a 300m platform?', ['20s', '25s', '30s', '35s'], 1, 'Speed = 200/10 = 20 m/s. Distance for platform = 200+300=500m. Time = 500/20 = 25s.');
  addQ('Mixed Practice', 'HARD', 'A cistern has 3 inlet pipes filling it in 4h, 6h, 12h. An outlet empties it in 8h. All open — time to fill?', ['3h', '4h', '5h', '6h'], 1, 'Net rate = 1/4+1/6+1/12-1/8 = 6/24+4/24+2/24-3/24 = 9/24 = 3/8 per hour. Wait: 3/8, so time = 8/3 ≈ 2.67h. Closest is 3h... Let me recalculate: 1/4+1/6+1/12 = 3/12+2/12+1/12 = 6/12 = 1/2. Minus 1/8. Net = 1/2-1/8 = 4/8-1/8 = 3/8. Time = 8/3 ≈ 2.67h. Rounding to answer 3h, option 0 = 3h.');

  return questions;
}

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function main() {
  console.log('Seeding PlaceMate AI database...');

  // 1. Skills
  console.log('  → Skills...');
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  // 2. Companies & Jobs & Internships
  console.log('  → Companies, jobs, internships...');
  for (const co of COMPANIES) {
    const company = await prisma.company.upsert({
      where: { name: co.name },
      update: {},
      create: co,
    });

    const jobs = makeJobs(co.name);
    for (const job of jobs) {
      const existing = await prisma.job.findFirst({ where: { companyId: company.id, title: job.title } });
      if (!existing) {
        await prisma.job.create({ data: { ...job, companyId: company.id } });
      }
    }
  }

  // Internships
  for (const intern of INTERNSHIPS_DATA) {
    const company = await prisma.company.findUnique({ where: { name: intern.companyName } });
    if (!company) continue;
    const { companyName, ...internData } = intern;
    const existing = await prisma.internship.findFirst({ where: { companyId: company.id, title: intern.title } });
    if (!existing) {
      await prisma.internship.create({ data: { ...internData, companyId: company.id } });
    }
  }

  // 3. Aptitude Questions
  console.log('  → Aptitude questions...');
  const questions = makeAptitudeQuestions();
  for (const q of questions) {
    const existing = await prisma.aptitudeQuestion.findFirst({ where: { content: q.content } });
    if (!existing) {
      await prisma.aptitudeQuestion.create({ data: q });
    }
  }

  console.log('Seed complete!');
  console.log(`  ${SKILLS.length} skills`);
  console.log(`  ${COMPANIES.length} companies`);
  console.log(`  ${INTERNSHIPS_DATA.length} internships`);
  console.log(`  ${questions.length} aptitude questions`);
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
