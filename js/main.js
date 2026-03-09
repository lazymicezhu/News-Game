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

function decideExperimentAssignment({ forcedVariant, aiConfigured }) {
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
    setupLanguage();
    setupTelemetry();
    updateStatsPanel();

    const introModal = document.getElementById('intro-modal');
    const introInput = document.getElementById('player-name-input');
    const introStepName = document.getElementById('intro-step-name');
    const introStepSurvey = document.getElementById('intro-step-survey');
    const introNextBtn = document.getElementById('intro-next-btn');
    const introBackBtn = document.getElementById('intro-back-btn');
    const introBtn = document.getElementById('intro-start-btn');
    const introLikertGroups = Array.from(document.querySelectorAll('.intro-likert'));

    const showIntroStep = (step) => {
        if (introStepName) introStepName.classList.toggle('is-active', step === 'name');
        if (introStepSurvey) introStepSurvey.classList.toggle('is-active', step === 'survey');
    };

    const getRadioValue = (name) => {
        const target = document.querySelector(`input[name="${name}"]:checked`);
        return target ? target.value : '';
    };

    const getLikertValue = (field) => {
        const selected = document.querySelector(`.intro-likert[data-field="${field}"] .intro-dot.is-selected`);
        return selected ? Number(selected.dataset.value) : null;
    };

    const clearSurveyForm = () => {
        Array.from(document.querySelectorAll('input[name="intro-familiarity"], input[name="pre-news-frequency"], input[name="pre-game-frequency"]'))
            .forEach((input) => { input.checked = false; });
        Array.from(document.querySelectorAll('input[name="pre-news-source"]'))
            .forEach((input) => { input.checked = false; });
        introLikertGroups.forEach((group) => {
            group.querySelectorAll('.intro-dot').forEach((dot) => dot.classList.remove('is-selected'));
        });
    };

    introLikertGroups.forEach((group) => {
        group.addEventListener('click', (event) => {
            const target = event.target.closest('.intro-dot');
            if (!target) return;
            group.querySelectorAll('.intro-dot').forEach((dot) => dot.classList.remove('is-selected'));
            target.classList.add('is-selected');
        });
    });

    const collectPreSurvey = () => {
        const newsSourceInputs = Array.from(document.querySelectorAll('input[name="pre-news-source"]:checked'));
        return {
            wildfireFamiliarity: getRadioValue('intro-familiarity'),
            aiReliable: getLikertValue('aiReliable'),
            aiCredible: getLikertValue('aiCredible'),
            aiUncertain: getLikertValue('aiUncertain'),
            newsFrequency: getRadioValue('pre-news-frequency'),
            newsSources: newsSourceInputs.map((input) => input.value),
            gameFrequency: getRadioValue('pre-game-frequency'),
            storyGameFamiliarity: getLikertValue('storyGameFamiliarity')
        };
    };

    const validateSurvey = () => {
        const data = collectPreSurvey();
        if (!data.wildfireFamiliarity) {
            window.alert('请先选择是否了解加州山火事件。');
            return null;
        }
        if (!data.aiReliable || !data.aiCredible || !data.aiUncertain) {
            window.alert('请完成三道 AI 可信度打分题。');
            return null;
        }
        if (!data.newsFrequency) {
            window.alert('请选择你的新闻阅读频率。');
            return null;
        }
        if (!data.newsSources.length) {
            window.alert('请至少选择一种新闻获取方式。');
            return null;
        }
        if (!data.gameFrequency) {
            window.alert('请选择你的电子游戏频率。');
            return null;
        }
        if (!data.storyGameFamiliarity) {
            window.alert('请完成“交互式故事或模拟类游戏熟悉度”打分。');
            return null;
        }
        return data;
    };

    const startGame = async (playerName, forcedVariant, preSurvey) => {
        if (introBtn) {
            introBtn.disabled = true;
        }
        if (introNextBtn) introNextBtn.disabled = true;
        if (introModal) introModal.style.display = 'none';
        setStatsVisibility(false);

        localStorage.removeItem('newsgame-ai-mask-seen');
        localStorage.removeItem('newsgame-tutorial-shop-hint-seen');
        resetStatsFinalization();
        const mergedScenes = await prepareOverrides();
        const aiConfigured = await isAiConfigured();
        const assignment = decideExperimentAssignment({ forcedVariant, aiConfigured });
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
                assignmentMode: assignment.mode || ''
            };
        }

        await playPreludeInterlude();
        // 初始化游戏路由
        gameRouter.init(mergedScenes, 'tutorial_intro');
        if (playerName) {
            gameState.setPlayerName(playerName);
        }
        if (preSurvey?.wildfireFamiliarity) {
            gameState.setWildfireFamiliarity(preSurvey.wildfireFamiliarity);
        } else {
            gameState.setWildfireFamiliarity('');
        }
        gameState.setPreSurvey(preSurvey || {});
        gameState.setReadingAssignment(readingAssignmentData);
        gameState.setPostSurvey({});
        gameState.setRewardInfo(null);
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

        // 添加键盘快捷键支持（可选）
        document.addEventListener('keydown', (e) => {
            // 按数字键选择选项
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                const buttons = Array.from(document.querySelectorAll('#app .choices .btn'));
                const button = buttons[num - 1];
                if (button) {
                    button.click();
                }
            }
        });
    };

    if (introNextBtn) {
        introNextBtn.addEventListener('click', () => {
            const rawName = introInput ? introInput.value.trim() : '';
            if (!rawName) {
                if (introInput) introInput.focus();
                return;
            }
            showIntroStep('survey');
        });
    }

    if (introBackBtn) {
        introBackBtn.addEventListener('click', () => {
            showIntroStep('name');
            if (introInput) introInput.focus();
        });
    }

    if (introBtn) {
        introBtn.addEventListener('click', () => {
            const rawName = introInput ? introInput.value.trim() : '';
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
            const surveyData = validateSurvey();
            if (!surveyData) return;
            startGame(name, forcedVariant, surveyData);
        });
    }
    if (introInput) {
        introInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (introStepName?.classList.contains('is-active')) {
                    introNextBtn?.click();
                }
            }
        });
    }

    console.log('🎮 Newsgame 已启动');
    console.log('💡 提示: 在结束场景按 R 键可快速重新开始');
    console.log('💡 提示: 可以使用数字键 1-9 快速选择选项');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
