const { recommendRoles, getPlaceholderScaffold, getSprintSuggestion } = require('../services/aiIntelligenceService');

/**
 * 27. AI Role Suggestions
 */
function suggestRoles(req, res, next) {
  try {
    const { members } = req.body;
    const suggestions = recommendRoles(members || []);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

/**
 * 28. AI Placeholder Scaffold Builder
 */
function placeholderScaffold(req, res, next) {
  try {
    const scaffold = getPlaceholderScaffold();
    res.json(scaffold);
  } catch (err) {
    next(err);
  }
}

/**
 * 29. AI Sprint Change Suggestions
 */
function sprintSuggestion(req, res, next) {
  try {
    const projectId = req.body.projectId || 1;
    const suggestion = getSprintSuggestion(projectId);
    res.json(suggestion);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  suggestRoles,
  placeholderScaffold,
  sprintSuggestion
};
