/**
 * Sales Copilot Decision Engine
 * Rule-based engine for next question selection, qualification scoring, and stage progression
 */

import type {
  PlaybookData,
  Question,
  Call,
  CallStage,
  QualificationResult,
  NextQuestionResult,
  Objection,
} from './types';

/**
 * Calculate qualification score based on call answers and tags
 */
export function calculateQualificationScore(
  playbook: PlaybookData,
  call: Call
): QualificationResult {
  const rules = playbook.qualification;
  let score = rules.score.start;

  // Apply score deltas from answers
  call.answers.forEach((answer) => {
    const question = playbook.questionBank.find((q) => q.id === answer.questionId);
    if (!question) return;

    // Apply score delta from selected option
    if (answer.selectedOption && question.options) {
      const option = question.options.find((o) => o.value === answer.selectedOption);
      if (option) {
        score += option.scoreDelta;
      }
    }

    // Apply score delta from free text (tagsOnAnswers)
    if (answer.freeText && question.tagsOnAnswers) {
      const lowerText = answer.freeText.toLowerCase();
      question.tagsOnAnswers.forEach((rule) => {
        if (rule.when.containsAny) {
          const matches = rule.when.containsAny.some((keyword) =>
            lowerText.includes(keyword.toLowerCase())
          );
          if (matches) {
            score += rule.scoreDelta;
            // Add tags to call
            rule.addTags.forEach((tag) => {
              if (!call.tags.includes(tag)) {
                call.tags.push(tag);
              }
            });
          }
        }
      });
    }

    // Apply scoring rules for number/scale questions
    if (question.scoringRules && answer.selectedOption) {
      const numValue = parseFloat(answer.selectedOption);
      if (!isNaN(numValue)) {
        question.scoringRules.forEach((rule) => {
          let matches = false;
          if (rule.when.op === '>=' && numValue >= rule.when.value) matches = true;
          if (rule.when.op === '<=' && numValue <= rule.when.value) matches = true;
          if (rule.when.op === '==' && numValue === rule.when.value) matches = true;
          if (rule.when.op === '<' && numValue < rule.when.value) matches = true;
          if (rule.when.op === '>' && numValue > rule.when.value) matches = true;

          if (matches) {
            score += rule.scoreDelta;
            if (rule.addTags.length > 0) {
              rule.addTags.forEach((tag) => {
                if (!call.tags.includes(tag)) {
                  call.tags.push(tag);
                }
              });
            }
          }
        });
      }
    }
  });

  // Clamp score
  score = Math.max(rules.score.clampMin, Math.min(rules.score.clampMax, score));

  // Check hard disqualify rules
  let hardDisqualify = null;
  for (const rule of rules.hardDisqualifyRules) {
    const tagsAny = rule.if.tagsAny.every((tag) => call.tags.includes(tag));
    const tagsNone =
      !rule.if.tagsNone ||
      rule.if.tagsNone.every((tag) => !call.tags.includes(tag));

    if (tagsAny && tagsNone) {
      hardDisqualify = {
        action: rule.then.action,
        reason: rule.then.reason,
        script: rule.then.script,
      };
      break;
    }
  }

  // Determine band
  const band = rules.score.bands.find(
    (b) => score >= b.min && score <= b.max
  )?.label as 'Low' | 'Medium' | 'High';

  // Check if should close
  const closeRule = rules.closeRule;
  const shouldClose =
    score >= closeRule.when.scoreGte &&
    (!closeRule.when.tagsNone ||
      closeRule.when.tagsNone.every((tag) => !call.tags.includes(tag))) &&
    closeRule.when.checkpointIdsComplete.every((cpId) =>
      isCheckpointComplete(playbook, call, cpId)
    );

  // Payment recommendation
  let paymentRecommendation: 'payment_plan' | 'pay_in_full' | undefined;
  for (const rec of rules.paymentRecommendation) {
    const tagsAny = rec.if.tagsAny.some((tag) => call.tags.includes(tag));
    if (tagsAny) {
      paymentRecommendation = rec.then.recommend;
      break;
    }
  }

  // Build reason
  let reason = `Score: ${score}/100 (${band})`;
  if (hardDisqualify) {
    reason += `. ${hardDisqualify.reason}`;
  } else if (shouldClose) {
    reason += '. Ready to close.';
  } else if (band === 'Low') {
    reason += '. Needs more qualification.';
  }

  return {
    score,
    band,
    reason,
    hardDisqualify: hardDisqualify || undefined,
    shouldClose,
    paymentRecommendation,
  };
}

/**
 * Check if a checkpoint is complete
 */
function isCheckpointComplete(
  playbook: PlaybookData,
  call: Call,
  checkpointId: string
): boolean {
  // Find questions that complete this checkpoint
  const questions = playbook.questionBank.filter(
    (q) => q.checkpointId === checkpointId
  );

  // Check if any answer exists for these questions
  return questions.some((q) =>
    call.answers.some((a) => a.questionId === q.id)
  );
}

/**
 * Get completed checkpoints for a stage
 */
function getCompletedCheckpoints(
  playbook: PlaybookData,
  call: Call,
  stageId: string
): string[] {
  const stage = playbook.stages.find((s) => s.id === stageId);
  if (!stage) return [];

  return stage.requiredCheckpoints.filter((cpId) =>
    isCheckpointComplete(playbook, call, cpId)
  );
}

/**
 * Get next stage based on completed checkpoints
 */
export function getNextStage(
  playbook: PlaybookData,
  call: Call
): CallStage | null {
  const currentStage = playbook.stages.find((s) => s.id === call.stage);
  if (!currentStage) return null;

  // Check stage progression rules
  for (const progression of playbook.decisionEngineHints.stageProgression) {
    if (progression.fromStageId === call.stage) {
      const allComplete = progression.when.checkpointIdsComplete.every((cpId) =>
        isCheckpointComplete(playbook, call, cpId)
      );
      if (allComplete) {
        return progression.toStageId as CallStage;
      }
    }
  }

  return null;
}

/**
 * Get next best question
 */
export function getNextQuestion(
  playbook: PlaybookData,
  call: Call
): NextQuestionResult | null {
  // Check priority rules first
  for (const priorityRule of playbook.decisionEngineHints.nextQuestionPriorityRules) {
    const tagsAny = priorityRule.if.tagsAny.some((tag) => call.tags.includes(tag));
    if (tagsAny && priorityRule.then.suggestQuestionId) {
      const question = playbook.questionBank.find(
        (q) => q.id === priorityRule.then.suggestQuestionId
      );
      if (question) {
        return {
          question,
          whyThisQuestion: priorityRule.then.reason,
          listenFor: question.listenFor || [],
          canAdvance: false,
        };
      }
    }
  }

  // Get current stage
  const currentStage = playbook.stages.find((s) => s.id === call.stage);
  if (!currentStage) return null;

  // Find unanswered questions in current stage
  const stageQuestions = playbook.questionBank.filter(
    (q) => q.stageId === call.stage
  );

  const answeredQuestionIds = new Set(call.answers.map((a) => a.questionId));
  const unansweredQuestions = stageQuestions.filter(
    (q) => !answeredQuestionIds.has(q.id)
  );

  // If all questions answered, check if we can advance
  if (unansweredQuestions.length === 0) {
    const nextStage = getNextStage(playbook, call);
    if (nextStage) {
      // Move to next stage and get first question
      const nextStageQuestions = playbook.questionBank.filter(
        (q) => q.stageId === nextStage
      );
      if (nextStageQuestions.length > 0) {
        return {
          question: nextStageQuestions[0],
          whyThisQuestion: `Moving to ${playbook.stages.find((s) => s.id === nextStage)?.name} stage.`,
          listenFor: nextStageQuestions[0].listenFor || [],
          canAdvance: true,
        };
      }
    }
    return null; // No more questions
  }

  // Return first unanswered question
  const question = unansweredQuestions[0];
  return {
    question,
    whyThisQuestion: `Completing ${currentStage.name} stage.`,
    listenFor: question.listenFor || [],
    canAdvance: false,
  };
}

/**
 * Get objection by ID
 */
export function getObjection(
  playbook: PlaybookData,
  objectionId: string
): Objection | null {
  return (
    playbook.objectionLibrary.find((o) => o.id === objectionId) || null
  );
}

/**
 * Get all objections
 */
export function getAllObjections(playbook: PlaybookData): Objection[] {
  return playbook.objectionLibrary;
}

