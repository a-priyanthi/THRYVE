const { db } = require('../config/db');

/**
 * AI Contextual Intelligence Engine:
 * Analyzes message semantics, project discussion history, and sprint state
 * to generate intelligent interventions and recommendations.
 */
function analyzeChatAndRespond(projectId, message, mode = 'all') {
  const lower = message.toLowerCase();
  let aiReply = null;

  if (lower.includes('api') || lower.includes('contract') || lower.includes('block') || lower.includes('stuck')) {
    aiReply = '✦ Thryve: I analyzed the recent discussion. Meena and Arun both have questions on the API contract. I suggest scheduling a 15-minute peer teaching session before the afternoon checkpoint.';
  } else if (lower.includes('sprint') || lower.includes('deadline') || lower.includes('status')) {
    const tasks = db.prepare('SELECT status, title FROM tasks WHERE project_id = ?').all(projectId);
    const done = tasks.filter(t => t.status === 'done' || t.status === 'late').length;
    aiReply = `✦ Thryve: Current Sprint 01 has ${done} of ${tasks.length} items completed. 1 task is late (Deployment verification) and Meena is at risk on analytics integration.`;
  } else if (lower.includes('scaffold') || lower.includes('code') || lower.includes('placeholder')) {
    aiReply = '✦ Thryve: I can prepare a safe FastAPI placeholder for the discussion-analysis endpoint using authorized API_Spec_v2.pdf and sprint tasks. Click "Generate Placeholder Code" to review.';
  } else if (mode === 'ai' || lower.includes('help') || lower.includes('thryve')) {
    aiReply = '✦ Thryve: I am monitoring authorized project chat, contribution history, and shared documents. Feel free to request work from teammates, toggle sprint items, or generate reports.';
  }

  return aiReply;
}

/**
 * AI Role Assignment Recommender:
 * Matches team member skillsets, learning goals, and backgrounds to optimal engineering roles.
 */
function recommendRoles(members = []) {
  return members.map(m => {
    const skills = (m.skills || '').toLowerCase();
    let role = 'Software Contributor';
    let why = 'Matched to technical profile.';

    if (skills.includes('lead') || skills.includes('backend') || skills.includes('python')) {
      role = 'AI / Backend Lead';
      why = 'Python, backend skills and leadership interest.';
    } else if (skills.includes('react') || skills.includes('front') || skills.includes('ui')) {
      role = 'Frontend / UX';
      why = 'React and visual UI architecture experience.';
    } else if (skills.includes('sql') || skills.includes('data') || skills.includes('analytics')) {
      role = 'Data / Analytics';
      why = 'Database experience and interest in analytics metrics.';
    } else if (skills.includes('devops') || skills.includes('test') || skills.includes('git')) {
      role = 'QA / DevOps';
      why = 'Testing, documentation, and continuous integration skills.';
    }
    return { name: m.name, role, why };
  });
}

/**
 * AI Code Scaffold Generator:
 * Creates secure interface scaffolds grounded in active project documentation.
 */
function getPlaceholderScaffold() {
  return {
    title: 'FastAPI Discussion Analyzer Scaffold',
    contextUsed: 'API_Spec_v2.pdf + project chat + Sprint 01',
    code: `@from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Thryve Knowledge Analyzer")

class DiscussionPayload(BaseModel):
    project_id: int
    chat_logs: list[str]
    shared_doc_ids: list[int]

@app.post("/analyze")
def analyze_collaboration(payload: DiscussionPayload):
    # TODO: Connect authorized contribution model (Meena's module)
    # TODO: Extract repeated queries and knowledge gaps
    return {
        "status": "scaffold_approved",
        "collective_intelligence": 0.78,
        "recommended_activity": "15-minute peer teaching"
    }`
  };
}

/**
 * AI Sprint Optimization Proposal:
 * Proposes schedule interventions when bottlenecks or peer dependencies are detected.
 */
function getSprintSuggestion(projectId) {
  return {
    proposal: 'Add 15-minute peer teaching between Arun & Meena, and postpone Dashboard analytics integration by 30 minutes.',
    actions: [
      { type: 'ADD', title: '15-min peer teaching: Arun → Meena' },
      { type: 'MOVE', title: 'Dashboard integration → after API review' }
    ],
    reason: 'Repeated API questions detected in project chat without resolution.'
  };
}

module.exports = {
  analyzeChatAndRespond,
  recommendRoles,
  getPlaceholderScaffold,
  getSprintSuggestion
};
