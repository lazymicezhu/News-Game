#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const REMOTE_STATS_ENDPOINT = 'https://newsgame-egxdvooreq.cn-hangzhou.fcapp.run/responses';

const DEFAULT_CONFIG = {
  minDurationMs: 8 * 60 * 1000,
  maxDurationMs: 40 * 60 * 1000,
  minCompletionRate: 1,
  outlierZThreshold: 3.29,
  expectedManipulation: null,
  strictManipulationCheck: false,
  allowedFamiliarityValues: ['yes', 'no', 'somewhat', 'heard_of', 'not_familiar'],
  allowedProducerValues: ['human', 'ai', 'unsure'],
  allowedBestFormatValues: ['text_news', 'interactive_game'],
  likertRange: { min: 1, max: 5 }
};

const REQUIRED_PRE_FIELDS = [
  'wildfireFamiliarity',
  'aiReliable',
  'aiCredible',
  'aiUncertain',
  'newsFrequency',
  'newsSources',
  'gameFrequency',
  'storyGameFamiliarity'
];

const REQUIRED_POST_FIELDS = [
  'manipulationProducer',
  'manipulationBestFormat',
  'credibilityAccuracy',
  'credibilityTrust',
  'credibilityFair',
  'credibilityDepth',
  'credibilityNeutral',
  'emotionConcern',
  'emotionSad',
  'emotionAngry',
  'emotionHope',
  'emotionAnxious',
  'narrativeImmersed',
  'narrativeChallenge',
  'narrativeEmotion',
  'narrativeImagine',
  'intentionShare',
  'intentionLearn'
];

const LIKERT_FIELDS = REQUIRED_PRE_FIELDS
  .filter((field) => ['aiReliable', 'aiCredible', 'aiUncertain', 'storyGameFamiliarity'].includes(field))
  .concat(REQUIRED_POST_FIELDS.filter((field) => field !== 'manipulationProducer' && field !== 'manipulationBestFormat'));

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isLikertValue(value, range) {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

function pickEntryShape(raw) {
  if (raw && typeof raw === 'object' && (raw.preSurvey || raw.postSurvey || raw.durationMs !== undefined)) {
    return {
      meta: raw,
      preSurvey: raw.preSurvey || {},
      postSurvey: raw.postSurvey || {},
      durationMs: Number(raw.durationMs ?? raw.duration_ms ?? 0),
      completionRate: Number(raw.completionRate ?? raw.completion_rate ?? 1),
      attentionChecks: raw.attentionChecks || raw.attention_checks || [],
      rewardStatus: raw.rewardStatus || raw.reward_status || '',
      id: raw.id || raw.responseId || raw.response_id || ''
    };
  }

  return {
    meta: raw,
    preSurvey: raw?.preSurvey || raw?.pre_survey || {},
    postSurvey: raw?.postSurvey || raw?.post_survey || {},
    durationMs: Number(raw?.durationMs ?? raw?.duration_ms ?? 0),
    completionRate: Number(raw?.completionRate ?? raw?.completion_rate ?? 1),
    attentionChecks: raw?.attentionChecks || raw?.attention_checks || [],
    rewardStatus: raw?.rewardStatus || raw?.reward_status || '',
    id: raw?.id || raw?.responseId || raw?.response_id || ''
  };
}

function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getRewardCodeFromEntry(rawEntry) {
  const rewardInfo = rawEntry?.rewardInfo || rawEntry?.reward_info || safeJsonParse(rawEntry?.reward_info_json, null) || {};
  return String(
    rewardInfo?.redeemCode ||
    rawEntry?.rewardCode ||
    rawEntry?.reward_code ||
    ''
  ).trim();
}

function getArticleTypeFromReadingAssignment(readingAssignment) {
  const id = String(readingAssignment?.id || '').toLowerCase();
  if (id.includes('ai_news') || id.includes('ai-news')) return 'ai';
  if (id.includes('ap_news') || id.includes('ap-news') || id.includes('human_news') || id.includes('human-news')) return 'human';
  const source = String(readingAssignment?.source || '').toLowerCase();
  if (source.includes('ai-news') || source.includes('ai news')) return 'ai';
  if (source.includes('ap-news') || source.includes('ap news') || source.includes('human')) return 'human';
  return '';
}

function inferExpectedManipulation(rawEntry) {
  const readingAssignment = rawEntry?.readingAssignment || rawEntry?.reading_assignment || safeJsonParse(rawEntry?.reading_assignment_json, null);
  const articleType = getArticleTypeFromReadingAssignment(readingAssignment);
  if (!articleType) return null;
  return {
    producer: articleType
  };
}

function calculateAnsweredCount(preSurvey, postSurvey) {
  let answered = 0;

  for (const field of REQUIRED_PRE_FIELDS) {
    if (!isBlank(preSurvey[field])) answered += 1;
  }

  for (const field of REQUIRED_POST_FIELDS) {
    if (!isBlank(postSurvey[field])) answered += 1;
  }

  return answered;
}

function normalizeAttentionChecks(rawChecks) {
  if (!Array.isArray(rawChecks)) return [];
  return rawChecks.map((check, index) => {
    if (typeof check === 'boolean') {
      return { name: `attention_${index + 1}`, passed: check };
    }
    return {
      name: String(check?.name || `attention_${index + 1}`),
      passed: Boolean(check?.passed)
    };
  });
}

function addIssue(target, code, message) {
  target.push({ code, message });
}

function checkRequiredFields(entry, config, hardFails, reviewFlags) {
  const { preSurvey, postSurvey, completionRate } = entry;

  for (const field of REQUIRED_PRE_FIELDS) {
    if (isBlank(preSurvey[field])) {
      addIssue(hardFails, `missing_pre_${field}`, `Missing required pre-survey field: ${field}`);
    }
  }

  for (const field of REQUIRED_POST_FIELDS) {
    if (isBlank(postSurvey[field])) {
      addIssue(hardFails, `missing_post_${field}`, `Missing required post-survey field: ${field}`);
    }
  }

  if (Number.isFinite(completionRate) && completionRate < config.minCompletionRate) {
    addIssue(hardFails, 'incomplete_response', `Completion rate ${completionRate} is below ${config.minCompletionRate}`);
  }

  if (!Number.isFinite(completionRate)) {
    const answeredCount = calculateAnsweredCount(preSurvey, postSurvey);
    const requiredCount = REQUIRED_PRE_FIELDS.length + REQUIRED_POST_FIELDS.length;
    const fallbackCompletion = answeredCount / requiredCount;
    if (fallbackCompletion < config.minCompletionRate) {
      addIssue(hardFails, 'incomplete_response', `Completion rate ${fallbackCompletion.toFixed(3)} is below ${config.minCompletionRate}`);
    }
  }

  if (!Array.isArray(preSurvey.newsSources) || preSurvey.newsSources.length === 0) {
    addIssue(hardFails, 'missing_news_sources', 'At least one pre-survey news source is required');
  }

  const producer = String(postSurvey.manipulationProducer || '').toLowerCase();
  if (producer && !config.allowedProducerValues.includes(producer)) {
    addIssue(reviewFlags, 'unexpected_manipulation_producer', `Unexpected manipulationProducer value: ${postSurvey.manipulationProducer}`);
  }

  const bestFormat = String(postSurvey.manipulationBestFormat || '').toLowerCase();
  if (bestFormat && !config.allowedBestFormatValues.includes(bestFormat)) {
    addIssue(reviewFlags, 'unexpected_best_format', `Unexpected manipulationBestFormat value: ${postSurvey.manipulationBestFormat}`);
  }

  const familiarity = String(preSurvey.wildfireFamiliarity || '').toLowerCase();
  if (familiarity && config.allowedFamiliarityValues.length && !config.allowedFamiliarityValues.includes(familiarity)) {
    addIssue(reviewFlags, 'unexpected_familiarity', `Unexpected wildfireFamiliarity value: ${preSurvey.wildfireFamiliarity}`);
  }
}

function checkLikertRanges(entry, config, hardFails) {
  const { preSurvey, postSurvey } = entry;
  for (const field of LIKERT_FIELDS) {
    const value = Object.prototype.hasOwnProperty.call(preSurvey, field) ? preSurvey[field] : postSurvey[field];
    if (isBlank(value)) continue;
    if (!isLikertValue(Number(value), config.likertRange)) {
      addIssue(hardFails, `invalid_likert_${field}`, `Field ${field} must be a ${config.likertRange.min}-${config.likertRange.max} Likert value`);
    }
  }
}

function checkAttention(entry, hardFails) {
  const checks = normalizeAttentionChecks(entry.attentionChecks);
  const failedChecks = checks.filter((item) => !item.passed);
  for (const failed of failedChecks) {
    addIssue(hardFails, `attention_failed_${failed.name}`, `Attention check failed: ${failed.name}`);
  }
}

function checkDuration(entry, config, hardFails, reviewFlags) {
  if (!Number.isFinite(entry.durationMs) || entry.durationMs <= 0) {
    addIssue(reviewFlags, 'missing_duration', 'Duration is missing; response-time filter cannot be applied');
    return;
  }

  if (entry.durationMs < config.minDurationMs) {
    addIssue(hardFails, 'duration_too_short', `Duration ${entry.durationMs}ms is below ${config.minDurationMs}ms`);
  }

  if (Number.isFinite(config.maxDurationMs) && entry.durationMs > config.maxDurationMs) {
    addIssue(reviewFlags, 'duration_too_long', `Duration ${entry.durationMs}ms is above ${config.maxDurationMs}ms`);
  }
}

function checkManipulation(entry, config, hardFails, reviewFlags) {
  if (!config.expectedManipulation) return;

  const expectedProducer = config.expectedManipulation.producer;
  const expectedFormat = config.expectedManipulation.format;
  const actualProducer = String(entry.postSurvey.manipulationProducer || '').toLowerCase();
  const actualFormat = String(entry.postSurvey.manipulationBestFormat || '').toLowerCase();

  if (expectedProducer && actualProducer && actualProducer !== expectedProducer) {
    const target = config.strictManipulationCheck ? hardFails : reviewFlags;
    addIssue(target, 'manipulation_producer_mismatch', `Expected producer ${expectedProducer}, got ${actualProducer}`);
  }

  if (expectedFormat && actualFormat && actualFormat !== expectedFormat) {
    const target = config.strictManipulationCheck ? hardFails : reviewFlags;
    addIssue(target, 'manipulation_format_mismatch', `Expected format ${expectedFormat}, got ${actualFormat}`);
  }
}

function checkOutlier(entry, config, reviewFlags) {
  const zScore = Number(entry.meta?.durationZScore ?? entry.meta?.duration_z_score);
  if (!Number.isFinite(zScore)) return;
  if (Math.abs(zScore) > config.outlierZThreshold) {
    addIssue(reviewFlags, 'duration_outlier', `Duration z-score ${zScore} exceeds +/-${config.outlierZThreshold}`);
  }
}

function validateEntry(rawEntry, rawConfig = {}) {
  const inferredManipulation = inferExpectedManipulation(rawEntry);
  const config = {
    ...DEFAULT_CONFIG,
    ...rawConfig,
    expectedManipulation: rawConfig.expectedManipulation || inferredManipulation || DEFAULT_CONFIG.expectedManipulation,
    likertRange: {
      ...DEFAULT_CONFIG.likertRange,
      ...(rawConfig.likertRange || {})
    }
  };

  const entry = pickEntryShape(rawEntry);
  const hardFails = [];
  const reviewFlags = [];

  checkRequiredFields(entry, config, hardFails, reviewFlags);
  checkLikertRanges(entry, config, hardFails);
  checkAttention(entry, hardFails);
  checkDuration(entry, config, hardFails, reviewFlags);
  checkManipulation(entry, config, hardFails, reviewFlags);
  checkOutlier(entry, config, reviewFlags);

  const status = hardFails.length > 0 ? 'invalid' : reviewFlags.length > 0 ? 'review' : 'valid';

  return {
    id: entry.id || null,
    status,
    valid: status === 'valid',
    shouldExcludeFromPrimaryAnalysis: hardFails.length > 0,
    hardFails,
    reviewFlags,
    metrics: {
      durationMs: entry.durationMs,
      completionRate: Number.isFinite(entry.completionRate) ? entry.completionRate : null,
      answeredRequiredFields: calculateAnsweredCount(entry.preSurvey, entry.postSurvey),
      totalRequiredFields: REQUIRED_PRE_FIELDS.length + REQUIRED_POST_FIELDS.length
    }
  };
}

function parseArgs(argv) {
  const args = { input: '', config: '', code: '', token: '', remote: false, pretty: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--input') args.input = argv[++i] || '';
    else if (token === '--config') args.config = argv[++i] || '';
    else if (token === '--code') args.code = argv[++i] || '';
    else if (token === '--token') args.token = argv[++i] || '';
    else if (token === '--remote') args.remote = true;
    else if (token === '--pretty') args.pretty = true;
  }
  return args;
}

function normalizeRemoteEntry(entry) {
  const createdAt = entry?.created_at ? new Date(entry.created_at).getTime() : Date.now();
  const preNewsSources = safeJsonParse(entry?.pre_news_sources_json, []);
  const choices = safeJsonParse(entry?.choices_json, []);
  const readingAssignment = safeJsonParse(entry?.reading_assignment_json, null);
  const postSurvey = safeJsonParse(entry?.post_survey_json, {});
  const rewardInfo = safeJsonParse(entry?.reward_info_json, null);
  return {
    id: entry?.id,
    name: entry?.name || '',
    aiEnabled: !!entry?.ai_enabled,
    clicks: Number(entry?.clicks || 0),
    distance: Number(entry?.distance || 0),
    aiInteractions: Number(entry?.ai_interactions || 0),
    newsValue: Number(entry?.news_value || 60),
    wildfireFamiliarity: entry?.wildfire_familiarity || '',
    durationMs: Number(entry?.duration_ms || 0),
    choices,
    aiLogs: safeJsonParse(entry?.ai_logs_json, []),
    nonAiLogs: safeJsonParse(entry?.non_ai_logs_json, []),
    readingAssignment: readingAssignment || null,
    rewardInfo: rewardInfo && typeof rewardInfo === 'object' ? rewardInfo : null,
    rewardCode: entry?.reward_code || '',
    rewardContactMethod: entry?.reward_contact_method || '',
    rewardLuckinPhone: entry?.reward_luckin_phone || '',
    rewardStatus: entry?.reward_status || '',
    postSurvey: postSurvey && typeof postSurvey === 'object' ? postSurvey : {},
    preSurvey: {
      aiReliable: entry?.pre_ai_reliable ?? null,
      aiCredible: entry?.pre_ai_credible ?? null,
      aiUncertain: entry?.pre_ai_uncertain ?? null,
      newsFrequency: entry?.pre_news_frequency || '',
      newsSources: Array.isArray(preNewsSources) ? preNewsSources : [],
      gameFrequency: entry?.pre_game_frequency || '',
      storyGameFamiliarity: entry?.pre_story_game_familiarity ?? null,
      wildfireFamiliarity: entry?.wildfire_familiarity || ''
    },
    timestamp: Number.isNaN(createdAt) ? Date.now() : createdAt
  };
}

async function fetchRemoteStats(adminToken) {
  if (!adminToken) {
    throw new Error('Remote lookup requires --token or NEWSGAME_ADMIN_TOKEN');
  }
  const response = await fetch(`${REMOTE_STATS_ENDPOINT}?page=1&pageSize=500`, {
    headers: {
      'x-admin-token': adminToken
    }
  });
  if (!response.ok) {
    throw new Error(`Remote lookup failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  const list = Array.isArray(payload?.list) ? payload.list.map(normalizeRemoteEntry) : [];
  return list;
}

async function loadEntries(args) {
  if (args.remote) {
    const token = args.token || process.env.NEWSGAME_ADMIN_TOKEN || '';
    return fetchRemoteStats(token);
  }

  if (!args.input) {
    throw new Error('Provide --input stats.json, or use --remote with --token');
  }

  const inputPath = path.resolve(args.input);
  const payload = readJsonFile(inputPath);
  return Array.isArray(payload) ? payload : [payload];
}

function findEntryByCode(entries, code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  return entries.find((entry) => getRewardCodeFromEntry(entry).toUpperCase() === normalizedCode) || null;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input && !args.remote) {
    console.error('Usage: node scripts/validate-questionnaire.mjs --input stats.json [--code CODE] [--config config.json] [--pretty]');
    console.error('   or: node scripts/validate-questionnaire.mjs --remote --token ADMIN_TOKEN --code CODE [--config config.json] [--pretty]');
    process.exit(1);
  }

  const configPath = args.config ? path.resolve(args.config) : '';
  const config = configPath ? readJsonFile(configPath) : {};
  const entries = await loadEntries(args);
  let result;

  if (args.code) {
    const matched = findEntryByCode(entries, args.code);
    if (!matched) {
      throw new Error(`Redeem code not found: ${args.code}`);
    }
    result = {
      code: args.code,
      matchedEntryId: matched.id || null,
      rewardStatus: matched.rewardInfo?.rewardStatus || matched.rewardStatus || '',
      validation: validateEntry(matched, config)
    };
  } else {
    result = entries.map((entry) => ({
      code: getRewardCodeFromEntry(entry) || null,
      matchedEntryId: entry.id || null,
      rewardStatus: entry.rewardInfo?.rewardStatus || entry.rewardStatus || '',
      validation: validateEntry(entry, config)
    }));
  }

  const output = args.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
  process.stdout.write(`${output}\n`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
