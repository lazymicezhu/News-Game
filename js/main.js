/**
 * 应用入口文件
 * 负责初始化游戏和绑定事件
 */

import { scenes } from './scenes.js';
import { gameRouter } from './router.js';
import { newsBoard } from './newsBoard.js';
import { setLanguage, getLanguage, onLanguageChange, t } from './i18n.js';
import { gameState } from './state.js';
import { updateStatsPanel, setStatsVisibility, setFollowupQuestions, setInterviewRoles, playPreludeInterlude, resetStatsFinalization } from './ui.js';
import { isAiConfigured } from './aiClient.js';
import { followupQuestions as baseFollowupQuestions } from '../data/followupQuestions.js';
import { readingArticles } from '../data/readingArticles.js';

const LANGUAGE_STORAGE_KEY = 'newsgame-lang';
const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
const SCENE_EDITOR_FILE = 'data/sceneCopyEditor.json';
const STATS_STORAGE_KEY = 'newsgame-stats';
const BALANCE_THRESHOLD = 4;
const STUDY_VARIANT_STORAGE_KEY = 'newsgame-study-variant';
const STUDY_VARIANTS = {
    p1: { key: 'p1', incentiveEnabled: true },
    p2: { key: 'p2', incentiveEnabled: false }
};
const FORCED_COMBO_MAP = {
    '1': { articleType: 'ai_news', aiEnabled: true, code: '1' },
    '2': { articleType: 'ai_news', aiEnabled: false, code: '2' },
    '3': { articleType: 'human_news', aiEnabled: true, code: '3' },
    '4': { articleType: 'human_news', aiEnabled: false, code: '4' }
};

function getStudyVariantFromLocation() {
    const presetVariant = String(window.__NEWSGAME_STUDY_VARIANT__ || '').toLowerCase();
    if (presetVariant === 'p2') return STUDY_VARIANTS.p2;
    if (presetVariant === 'p1') return STUDY_VARIANTS.p1;
    const path = String(window.location.pathname || '/').toLowerCase();
    const params = new URLSearchParams(window.location.search || '');
    const queryVariant = String(params.get('variant') || '').toLowerCase();
    if (queryVariant === 'p2') return STUDY_VARIANTS.p2;
    if (queryVariant === 'p1') return STUDY_VARIANTS.p1;
    if (path === '/p2' || path.startsWith('/p2/')) return STUDY_VARIANTS.p2;
    if (path === '/p1' || path.startsWith('/p1/')) return STUDY_VARIANTS.p1;
    try {
        const storedVariant = String(window.sessionStorage.getItem(STUDY_VARIANT_STORAGE_KEY) || '').toLowerCase();
        if (storedVariant === 'p2') return STUDY_VARIANTS.p2;
        if (storedVariant === 'p1') return STUDY_VARIANTS.p1;
    } catch {
        // ignore storage failures
    }
    return STUDY_VARIANTS.p1;
}

function applyStudyVariant(studyVariant) {
    const body = document.body;
    if (body) {
        body.dataset.studyVariant = studyVariant.key;
        body.dataset.incentiveEnabled = studyVariant.incentiveEnabled ? 'true' : 'false';
    }

    try {
        window.sessionStorage.setItem(STUDY_VARIANT_STORAGE_KEY, studyVariant.key);
    } catch {
        // ignore storage failures
    }
}

function loadOverrides() {
    try {
        return JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

async function loadSceneCopyEditor() {
    try {
        const res = await fetch(SCENE_EDITOR_FILE, { cache: 'no-store' });
        if (!res.ok) return [];
        const payload = await res.json();
        return Array.isArray(payload) ? payload : [];
    } catch {
        return [];
    }
}

function buildSceneOverridesFromEditor(baseScenes, editorRows) {
    const stripChoiceDeltaSuffix = (value) => {
        if (typeof value !== 'string') return value;
        return value
            .replace(/\s*[（(]\s*[+\-]\d+\s*[）)]\s*$/, '')
            .trim();
    };

    const sceneOverrides = {};
    (editorRows || []).forEach((row) => {
        if (!row || !row.sceneId) return;
        const sceneId = row.sceneId;
        const baseScene = (baseScenes && baseScenes[sceneId]) || {};
        const nextScene = {};

        if (typeof row.title === 'string') {
            nextScene.title = { zh: row.title };
        }
        if (typeof row.text === 'string') {
            nextScene.text = { zh: row.text };
        }
        if (Array.isArray(row.choices)) {
            const baseChoices = Array.isArray(baseScene.choices) ? baseScene.choices : [];
            nextScene.choices = row.choices
                .filter((overrideText) => typeof overrideText === 'string' && overrideText.trim())
                .map((overrideText, index) => {
                    const baseChoice = baseChoices[index] || {};
                return {
                    ...baseChoice,
                    text: {
                        ...(baseChoice.text || {}),
                        zh: stripChoiceDeltaSuffix(overrideText)
                    }
                };
            });
        }

        if (Object.keys(nextScene).length > 0) {
            sceneOverrides[sceneId] = nextScene;
        }
    });
    return sceneOverrides;
}

function mergeScenes(baseScenes, overrideScenes = {}) {
    const merged = {};
    Object.entries(baseScenes || {}).forEach(([sceneId, scene]) => {
        const baseScene = scene || {};
        const nextScene = {
            ...baseScene,
            title: baseScene.title ? { ...baseScene.title } : undefined,
            text: baseScene.text ? { ...baseScene.text } : undefined,
            choices: Array.isArray(baseScene.choices)
                ? baseScene.choices.map((choice) => ({
                    ...choice,
                    text: choice.text ? { ...choice.text } : choice.text,
                    hint: choice.hint ? { ...choice.hint } : choice.hint
                }))
                : []
        };
        const override = overrideScenes[sceneId];
        if (override) {
            if (override.title) {
                nextScene.title = { ...(nextScene.title || {}), ...override.title };
            }
            if (override.text) {
                nextScene.text = { ...(nextScene.text || {}), ...override.text };
            }
            if (Object.prototype.hasOwnProperty.call(override, 'image')) {
                nextScene.image = override.image || '';
            }
            if (Array.isArray(override.choices)) {
                nextScene.choices = override.choices.map((choice) => ({
                    ...choice,
                    text: choice.text ? { ...choice.text } : choice.text,
                    hint: choice.hint ? { ...choice.hint } : choice.hint
                }));
            }
        }
        merged[sceneId] = nextScene;
    });

    Object.entries(overrideScenes || {}).forEach(([sceneId, override]) => {
        if (!merged[sceneId]) {
            merged[sceneId] = {
                ...override,
                title: override.title ? { ...override.title } : undefined,
                text: override.text ? { ...override.text } : undefined,
                choices: Array.isArray(override.choices)
                    ? override.choices.map((choice) => ({
                        ...choice,
                        text: choice.text ? { ...choice.text } : choice.text,
                        hint: choice.hint ? { ...choice.hint } : choice.hint
                    }))
                    : []
            };
        }
    });
    return merged;
}

function mergeFollowupQuestions(baseQuestions, overrideQuestions = {}) {
    const merged = { ...(baseQuestions || {}) };
    Object.entries(overrideQuestions || {}).forEach(([sceneId, questions]) => {
        merged[sceneId] = questions;
    });
    return merged;
}

async function prepareOverrides() {
    const editorRows = await loadSceneCopyEditor();
    const fileOverrides = {
        scenes: buildSceneOverridesFromEditor(scenes, editorRows)
    };
    const overrides = loadOverrides();
    const mergedScenesFromFile = mergeScenes(scenes, fileOverrides.scenes || {});
    const mergedScenes = mergeScenes(mergedScenesFromFile, overrides.scenes || {});
    const mergedQuestions = mergeFollowupQuestions(baseFollowupQuestions, overrides.followupQuestions || {});
    setFollowupQuestions(mergedQuestions);
    setInterviewRoles(overrides.interviewRoles);
    return mergedScenes;
}

function applyStaticText() {
    const titleEl = document.querySelector('.game-title');
    const boardTitle = document.querySelector('.news-board-title');
    const boardSub = document.querySelector('.news-board-sub');
    const languageLabel = document.querySelector('label[for=\"language-select\"]');
    const loadingEl = document.querySelector('#app .loading');
    const introTitle = document.querySelector('.intro-title');
    const introText = document.querySelector('.intro-text');
    const introNameLabel = document.querySelector('label[for="player-name-input"]');
    const introInput = document.getElementById('player-name-input');
    const introBtn = document.getElementById('intro-start-btn');
    const statsTitle = document.querySelector('.stats-title');
    const statsReporter = document.getElementById('stats-label-reporter');
    const statsScore = document.getElementById('stats-label-score');
    const statsClicks = document.getElementById('stats-label-clicks');
    const statsDistance = document.getElementById('stats-label-distance');
    const statsAi = document.getElementById('stats-label-ai');
    const statsChoices = document.getElementById('stats-label-choices');
    const liveScoreLabel = document.getElementById('live-score-label');

    document.title = t('gameTitle');
    if (titleEl) titleEl.textContent = t('gameTitle');
    if (boardTitle) boardTitle.textContent = t('liveBoardTitle');
    if (boardSub) boardSub.textContent = t('liveBoardSub');
    if (languageLabel) languageLabel.textContent = t('languageLabel');
    if (loadingEl) loadingEl.textContent = t('loading');
    if (introTitle) introTitle.textContent = t('introTitle');
    // Keep intro rich text authored in HTML; avoid overriding with plain text.
    if (introText && !introText.dataset.staticIntroBound) {
        introText.dataset.staticIntroBound = '1';
    }
    if (introNameLabel) introNameLabel.textContent = t('introNameLabel');
    if (introInput) introInput.placeholder = t('introNamePlaceholder');
    if (introBtn) introBtn.textContent = t('introStart');
    if (statsTitle) statsTitle.textContent = t('statsTitle');
    if (statsReporter) statsReporter.textContent = t('statsReporter');
    if (statsScore) statsScore.textContent = t('statsScore');
    if (liveScoreLabel) liveScoreLabel.textContent = t('statsScore');
    if (statsClicks) statsClicks.textContent = t('statsClicks');
    if (statsDistance) statsDistance.textContent = t('statsDistance');
    if (statsAi) statsAi.textContent = t('statsAi');
    if (statsChoices) statsChoices.textContent = t('statsChoices');
}

function setupLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) {
        setLanguage(saved);
    }
    gameState.resetAssistantLines();
    applyStaticText();

    const select = document.getElementById('language-select');
    if (select) {
        select.value = getLanguage();
        select.addEventListener('change', (e) => {
            const lang = e.target.value;
            const previous = getLanguage();
            setLanguage(lang);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            if (lang === previous) {
                gameState.resetAssistantLines();
                applyStaticText();
                gameRouter.rerenderCurrent();
                newsBoard.refreshLanguage();
            }
        });
    }

    onLanguageChange(() => {
        gameState.resetAssistantLines();
        applyStaticText();
        gameRouter.rerenderCurrent();
        newsBoard.refreshLanguage();
    });
}

function setupTelemetry() {
    const isIntroVisible = () => {
        const modal = document.getElementById('intro-modal');
        return modal && modal.style.display !== 'none';
    };

    document.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (isIntroVisible()) return;
        if (!gameState.isTelemetryActive()) return;
        gameState.incrementClick();
        const width = window.innerWidth || 1;
        const height = window.innerHeight || 1;
        const x = Math.min(1, Math.max(0, event.clientX / width));
        const y = Math.min(1, Math.max(0, event.clientY / height));
        gameState.addClickPoint({ x, y });
        updateStatsPanel();
    });

    document.addEventListener('mousemove', (event) => {
        if (isIntroVisible()) return;
        if (!gameState.isTelemetryActive()) return;
        const last = gameState.getLastMousePos();
        if (last) {
            const dx = event.clientX - last.x;
            const dy = event.clientY - last.y;
            const delta = Math.sqrt(dx * dx + dy * dy);
            gameState.addMouseDistance(delta);
        }
        gameState.setLastMousePos({ x: event.clientX, y: event.clientY });
        updateStatsPanel();
    });
}

function pickRandomArticle() {
    if (!Array.isArray(readingArticles) || !readingArticles.length) return null;
    const index = Math.floor(Math.random() * readingArticles.length);
    return readingArticles[index] || null;
}

function getArticleTypeFromId(articleId) {
    const id = String(articleId || '').toLowerCase();
    if (!id) return '';
    if (id.includes('ai_news') || id.includes('ai-news')) return 'ai_news';
    return 'human_news';
}

function getArticleTypeFromSource(source) {
    const text = String(source || '').toLowerCase();
    if (!text) return '';
    if (text.includes('ai-news') || text.includes('ai news')) return 'ai_news';
    if (text.includes('ap-news') || text.includes('ap news')) return 'human_news';
    return '';
}

function getArticleTypeFromEntry(entry) {
    if (!entry) return '';
    const directType = getArticleTypeFromId(entry?.readingAssignment?.id);
    if (directType) return directType;
    const sourceType = getArticleTypeFromSource(entry?.readingAssignment?.source);
    if (sourceType) return sourceType;
    const choices = Array.isArray(entry?.choices) ? entry.choices : [];
    const marker = choices.find((item) => item && item.sceneId === 'reading_assignment');
    if (marker?.text) {
        return getArticleTypeFromSource(marker.text);
    }
    return '';
}

function getComboKey(aiEnabled, articleType) {
    const aiKey = aiEnabled ? 'ai_game' : 'nonai_game';
    const articleKey = articleType === 'ai_news' ? 'ai_news' : 'human_news';
    return `${articleKey}__${aiKey}`;
}

function loadHistoricalStats() {
    try {
        const raw = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function countComboStats(list) {
    const combos = {
        ai_news__ai_game: 0,
        human_news__ai_game: 0,
        ai_news__nonai_game: 0,
        human_news__nonai_game: 0
    };
    let validCount = 0;
    (Array.isArray(list) ? list : []).forEach((entry) => {
        const articleType = getArticleTypeFromEntry(entry);
        if (!articleType) return;
        const key = getComboKey(!!entry.aiEnabled, articleType);
        if (!Object.prototype.hasOwnProperty.call(combos, key)) return;
        combos[key] += 1;
        validCount += 1;
    });
    return { combos, validCount };
}

function chooseBalancedComboKey(combos) {
    const keys = Object.keys(combos);
    if (!keys.length) return '';
    let min = Infinity;
    keys.forEach((key) => {
        min = Math.min(min, Number(combos[key] || 0));
    });
    const candidates = keys.filter((key) => Number(combos[key] || 0) === min);
    if (!candidates.length) return keys[0];
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickArticleByType(articleType) {
    const target = articleType === 'ai_news' ? 'ai_news' : 'human_news';
    const matched = readingArticles.filter((item) => getArticleTypeFromId(item?.id) === target);
    if (!matched.length) return pickRandomArticle();
    return matched[Math.floor(Math.random() * matched.length)];
}

function getForcedComboByCode(code) {
    return FORCED_COMBO_MAP[String(code || '').trim()] || null;
}

function getForcedComboFromLocation() {
    const params = new URLSearchParams(window.location.search || '');
    const rawCode = String(
        params.get('condition') ||
        params.get('combo') ||
        params.get('group') ||
        ''
    ).trim();
    return getForcedComboByCode(rawCode);
}

function decideExperimentAssignment({ forcedVariant, forcedComboCode, aiConfigured }) {
    const forcedCombo = getForcedComboByCode(forcedComboCode) || getForcedComboFromLocation();
    if (forcedCombo) {
        return {
            aiEnabled: forcedCombo.aiEnabled,
            article: pickArticleByType(forcedCombo.articleType),
            articleType: forcedCombo.articleType,
            mode: 'forced_combo',
            comboCode: forcedCombo.code
        };
    }

    const history = loadHistoricalStats();
    const { combos, validCount } = countComboStats(history);

    if (forcedVariant === 'AI') {
        const article = pickRandomArticle();
        return {
            aiEnabled: true,
            article,
            mode: 'forced'
        };
    }
    if (forcedVariant === 'NORMAL') {
        const article = pickRandomArticle();
        return {
            aiEnabled: false,
            article,
            mode: 'forced'
        };
    }

    if (!aiConfigured) {
        return {
            aiEnabled: false,
            article: pickRandomArticle(),
            mode: 'fallback_nonai'
        };
    }

    if (validCount > BALANCE_THRESHOLD) {
        const comboKey = chooseBalancedComboKey(combos);
        const aiEnabled = comboKey.endsWith('__ai_game');
        const articleType = comboKey.startsWith('ai_news__') ? 'ai_news' : 'human_news';
        return {
            aiEnabled,
            article: pickArticleByType(articleType),
            mode: 'balanced',
            comboKey
        };
    }

    const aiEnabled = Math.random() < 0.5;
    const articleType = Math.random() < 0.5 ? 'ai_news' : 'human_news';
    return {
        aiEnabled,
        article: pickArticleByType(articleType),
        mode: 'random_50_50'
    };
}

function escapeHtml(text) {
    return String(text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function resolveRelativePath(basePath, targetPath) {
    if (!targetPath) return '';
    if (/^(https?:)?\/\//.test(targetPath) || targetPath.startsWith('/')) {
        return targetPath;
    }
    const baseParts = String(basePath || '').split('/').filter(Boolean);
    if (baseParts.length) baseParts.pop();
    const targetParts = String(targetPath).split('/').filter(Boolean);
    const stack = [...baseParts];
    targetParts.forEach((part) => {
        if (part === '.') return;
        if (part === '..') {
            if (stack.length) stack.pop();
            return;
        }
        stack.push(part);
    });
    return stack.join('/');
}

function renderMarkdownToHtml(markdown, basePath = '') {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let inList = false;

    const closeList = () => {
        if (!inList) return;
        html.push('</ul>');
        inList = false;
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
            closeList();
            continue;
        }

        const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imageMatch) {
            closeList();
            const alt = escapeHtml(imageMatch[1] || '');
            const resolved = resolveRelativePath(basePath, imageMatch[2] || '');
            const src = escapeHtml(resolved);
            html.push(`<p><img src="${src}" alt="${alt}" class="reading-image" /></p>`);
            continue;
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!inList) {
                html.push('<ul>');
                inList = true;
            }
            html.push(`<li>${escapeHtml(line.slice(2).trim())}</li>`);
            continue;
        }

        if (line.startsWith('### ')) {
            closeList();
            html.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
            continue;
        }
        if (line.startsWith('## ')) {
            closeList();
            html.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
            continue;
        }
        if (line.startsWith('# ')) {
            closeList();
            html.push(`<h1>${escapeHtml(line.slice(2).trim())}</h1>`);
            continue;
        }

        closeList();
        html.push(`<p>${escapeHtml(line)}</p>`);
    }
    closeList();
    return html.join('\n');
}

async function loadArticleMarkdown(article) {
    if (!article?.markdownPath) return '';
    try {
        const response = await fetch(article.markdownPath, { cache: 'no-store' });
        if (!response.ok) return '';
        return await response.text();
    } catch {
        return '';
    }
}

function showReadingModal(article) {
    return new Promise((resolve) => {
        const modal = document.getElementById('reading-modal');
        const titleEl = document.getElementById('reading-title');
        const bodyEl = document.getElementById('reading-body');
        const doneBtn = document.getElementById('reading-done-btn');
        if (!modal || !titleEl || !bodyEl || !doneBtn || !article) {
            resolve(0);
            return;
        }
        titleEl.textContent = '加载中...';
        bodyEl.textContent = '';
        modal.style.display = 'flex';
        loadArticleMarkdown(article).then((markdown) => {
            const content = markdown || '';
            const firstLine = content.split('\n').map((s) => s.trim()).find(Boolean) || '';
            titleEl.textContent = firstLine || '阅读材料';
            bodyEl.innerHTML = renderMarkdownToHtml(content, article.markdownPath || '');
            const startedAt = Date.now();
            const onDone = () => {
                doneBtn.removeEventListener('click', onDone);
                modal.style.display = 'none';
                resolve(Math.max(0, Date.now() - startedAt));
            };
            doneBtn.addEventListener('click', onDone);
        }).catch(() => {
            titleEl.textContent = '阅读材料';
            bodyEl.textContent = '加载失败，请刷新页面重试。';
            const onDone = () => {
                doneBtn.removeEventListener('click', onDone);
                modal.style.display = 'none';
                resolve(0);
            };
            doneBtn.addEventListener('click', onDone);
        });
    });
}

/**
 * 初始化应用
 */
function init() {
    const studyVariant = getStudyVariantFromLocation();
    gameState.setStudyVariant(studyVariant.key);
    applyStudyVariant(studyVariant);
    setupLanguage();
    setupTelemetry();
    updateStatsPanel();

    const introModal = document.getElementById('intro-modal');
    const experimentCodeInput = document.getElementById('experiment-code-input');
    const introInput = document.getElementById('player-name-input');
    const introStepName = document.getElementById('intro-step-name');
    const introBtn = document.getElementById('intro-start-btn');

    if (experimentCodeInput) {
        experimentCodeInput.addEventListener('input', () => {
            experimentCodeInput.value = experimentCodeInput.value.replace(/[^\d]/g, '').slice(0, 1);
        });
    }

    const startGame = async (playerName, forcedVariant, forcedComboCode) => {
        if (introBtn) {
            introBtn.disabled = true;
        }
        if (introModal) introModal.style.display = 'none';
        setStatsVisibility(false);

        localStorage.removeItem('newsgame-ai-mask-seen');
        localStorage.removeItem('newsgame-tutorial-shop-hint-seen');
        resetStatsFinalization();
        const mergedScenes = await prepareOverrides();
        const aiConfigured = await isAiConfigured();
        const assignment = decideExperimentAssignment({ forcedVariant, forcedComboCode, aiConfigured });
        const effectiveAiEnabled = !!assignment.aiEnabled;
        gameState.setAiEnabled(effectiveAiEnabled);

        const article = assignment.article;
        let readingAssignmentData = null;
        if (article) {
            const readingMs = await showReadingModal(article);
            const articleType = getArticleTypeFromId(article.id) || getArticleTypeFromSource(article.source) || '';
            const assignmentKey = getComboKey(effectiveAiEnabled, articleType || 'human_news');
            readingAssignmentData = {
                id: article.id,
                source: article.source,
                markdownPath: article.markdownPath || '',
                readingMs,
                articleType,
                assignmentKey,
                assignmentMode: assignment.mode || '',
                comboCode: assignment.comboCode || ''
            };
        }

        await playPreludeInterlude();
        // 初始化游戏路由
        gameRouter.init(mergedScenes, 'tutorial_intro');
        if (playerName) {
            gameState.setPlayerName(playerName);
        }
        gameState.setWildfireFamiliarity('');
        gameState.setPreSurvey({});
        gameState.setReadingAssignment(readingAssignmentData);
        gameState.setPostSurvey({});
        gameState.setRewardInfo(null);
        gameState.setStudyVariant(studyVariant.key);
        gameState.setAiEnabled(effectiveAiEnabled);
        if (forcedVariant) {
            gameState.setPlayerName(forcedVariant);
        }
        gameState.setAiConfigured(aiConfigured);
        gameRouter.rerenderCurrent();
        gameState.startSession();
        gameState.setTelemetryActive(true);
        gameState.setLastMousePos(null);
        updateStatsPanel();

        // 初始化新闻看板
        newsBoard.init();

    };

    if (introBtn) {
        introBtn.addEventListener('click', () => {
            const experimentCode = experimentCodeInput ? experimentCodeInput.value.trim() : '';
            const rawName = introInput ? introInput.value.trim() : '';
            if (!getForcedComboByCode(experimentCode)) {
                if (experimentCodeInput) {
                    experimentCodeInput.focus();
                }
                window.alert('请输入有效的实验编号。');
                return;
            }
            if (!rawName) {
                if (introInput) {
                    introInput.focus();
                }
                return;
            }
            const upper = rawName.toUpperCase();
            let forcedVariant = null;
            if (upper === 'AI') forcedVariant = 'AI';
            if (upper === 'NORMAL') forcedVariant = 'NORMAL';
            const name = forcedVariant ? '' : rawName;
            startGame(name, forcedVariant, experimentCode);
        });
    }
    console.log('🎮 Newsgame 已启动');
    console.log('💡 提示: 在结束场景按 R 键可快速重新开始');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
