'use strict';
/**
 * matchingService.js — PlaceMate AI
 *
 * Single implementation of TF-IDF cosine similarity used for:
 *  - Resume ↔ role matching
 *  - Job match % for a user
 *  - Skill gap ranking
 *  - Chatbot fallback retrieval
 *
 * Uses the `natural` npm library for TF-IDF computation.
 */

const natural = require('natural');

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// ─────────────────────────────────────────────
// tokenize — clean + lowercase text into tokens
// ─────────────────────────────────────────────
function tokenize(text) {
  if (!text) return [];
  return tokenizer.tokenize(text.toLowerCase()).filter(t => t.length > 1);
}

// ─────────────────────────────────────────────
// buildTfIdfVector — build term-frequency vector
// Returns a Map<term, tfidf_score>
// ─────────────────────────────────────────────
function buildTfIdfVector(text, corpus = []) {
  const tfidf = new TfIdf();

  // Add the query document first, then corpus documents for IDF context
  tfidf.addDocument(tokenize(text));
  for (const doc of corpus) {
    tfidf.addDocument(tokenize(doc));
  }

  const vector = new Map();
  tfidf.listTerms(0 /* document index 0 = query */).forEach(item => {
    vector.set(item.term, item.tfidf);
  });

  return vector;
}

// ─────────────────────────────────────────────
// cosineSimilarity — computes cosine sim between two term vectors
// ─────────────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const [term, score] of vecA) {
    if (vecB.has(term)) {
      dotProduct += score * vecB.get(term);
    }
    magnitudeA += score * score;
  }
  for (const [, score] of vecB) {
    magnitudeB += score * score;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ─────────────────────────────────────────────
// computeMatchScore — main public API
// Returns a score 0–100 (clamped, rounded)
// ─────────────────────────────────────────────
function computeMatchScore(textA, textB, corpus = []) {
  if (!textA || !textB) return 0;

  const vecA = buildTfIdfVector(textA, [textB, ...corpus]);
  const vecB = buildTfIdfVector(textB, [textA, ...corpus]);

  const similarity = cosineSimilarity(vecA, vecB);

  // Scale to 0–100 and round
  return Math.min(100, Math.round(similarity * 100));
}

// ─────────────────────────────────────────────
// computeJobMatchScore — convenience wrapper
// Combines: user skills text + resume text vs job requirements text
// ─────────────────────────────────────────────
function computeJobMatchScore(userProfile, job) {
  const userText = [
    userProfile.resumeText || '',
    userProfile.domain || '',
    userProfile.targetRole || '',
    (userProfile.skills || []).join(' '),
  ].join(' ');

  const jobText = [
    job.title || '',
    job.description || '',
    job.skillsRequired || '',
  ].join(' ');

  return computeMatchScore(userText, jobText);
}

// ─────────────────────────────────────────────
// rankSkillGaps — ranks skills by gap size & relevance to target role
// Returns skills sorted by combined score (descending = most critical first)
// ─────────────────────────────────────────────
function rankSkillGaps(userSkills, targetRoleText, allSkills) {
  return allSkills
    .map(skill => {
      const userSkill = userSkills.find(us => us.skill.name === skill.name);
      const proficiency = userSkill ? userSkill.proficiency : 0;
      const relevance = computeMatchScore(skill.name, targetRoleText) / 100;
      const gap = (1 - proficiency / 100) * 0.6 + relevance * 0.4;

      return {
        skill,
        proficiency,
        gap: Math.round(gap * 100),
        relevance: Math.round(relevance * 100),
        reason: userSkill
          ? `Your proficiency is ${proficiency}% — ${100 - proficiency}% gap to master`
          : `Missing skill — highly relevant to ${targetRoleText || 'your target role'}`,
      };
    })
    .sort((a, b) => b.gap - a.gap);
}

// ─────────────────────────────────────────────
// findSimilarDocuments — used by chatbot fallback retrieval
// Returns indices of the top-k most similar documents
// ─────────────────────────────────────────────
function findSimilarDocuments(query, documents, topK = 3) {
  const queryVec = buildTfIdfVector(query, documents);
  const scores = documents.map((doc, idx) => {
    const docVec = buildTfIdfVector(doc, [query, ...documents]);
    return { idx, score: cosineSimilarity(queryVec, docVec) };
  });
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(s => s.score > 0.05); // min relevance threshold
}

module.exports = {
  computeMatchScore,
  computeJobMatchScore,
  rankSkillGaps,
  findSimilarDocuments,
  tokenize,
};
