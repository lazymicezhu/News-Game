/**
 * 应用入口文件
 * 负责初始化游戏和绑定事件
 */

import { scenes } from './scenes.js';
import { gameRouter } from './router.js';
import { newsBoard } from './newsBoard.js';
import { setLanguage, getLanguage, onLanguageChange, t } from './i18n.js';
import { gameState } from './state.js';
import { updateStatsPanel, setStatsVisibility, setFollowupQuestions, setInterviewRoles, playPreludeInterlude } from './ui.js';
import { isAiConfigured } from './aiClient.js';
import { followupQuestions as baseFollowupQuestions } from '../data/followupQuestions.js';

const LANGUAGE_STORAGE_KEY = 'newsgame-lang';
const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
const SCENE_EDITOR_FILE = 'data/sceneCopyEditor.json';

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
            nextScene.choices = baseChoices.map((baseChoice, index) => {
                const overrideText = row.choices[index];
                if (typeof overrideText !== 'string') {
                    return {
                        ...baseChoice,
                        text: baseChoice.text ? { ...baseChoice.text } : baseChoice.text
                    };
                }
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
    const restartBtn = document.getElementById('restart-btn');
    const boardTitle = document.querySelector('.news-board-title');
    const boardSub = document.querySelector('.news-board-sub');
    const languageLabel = document.querySelector('label[for=\"language-select\"]');
    const loadingEl = document.querySelector('#app .loading');
    const introTitle = document.querySelector('.intro-title');
    const introText = document.querySelector('.intro-text');
    const introNameLabel = document.querySelector('label[for="player-name-input"]');
    const introInput = document.getElementById('player-name-input');
    const introFamiliarityLabel = document.querySelector('label[for="intro-familiarity"]');
    const introFamiliaritySelect = document.getElementById('intro-familiarity');
    const introFamiliarityYes = introFamiliaritySelect?.querySelector('option[value="yes"]');
    const introFamiliarityNo = introFamiliaritySelect?.querySelector('option[value="no"]');
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
    if (restartBtn) restartBtn.textContent = t('restart');
    if (boardTitle) boardTitle.textContent = t('liveBoardTitle');
    if (boardSub) boardSub.textContent = t('liveBoardSub');
    if (languageLabel) languageLabel.textContent = t('languageLabel');
    if (loadingEl) loadingEl.textContent = t('loading');
    if (introTitle) introTitle.textContent = t('introTitle');
    if (introText) introText.textContent = t('introBody');
    if (introNameLabel) introNameLabel.textContent = t('introNameLabel');
    if (introInput) introInput.placeholder = t('introNamePlaceholder');
    if (introFamiliarityLabel) introFamiliarityLabel.textContent = t('introFamiliarityLabel');
    if (introFamiliarityYes) introFamiliarityYes.textContent = t('introFamiliarityYes');
    if (introFamiliarityNo) introFamiliarityNo.textContent = t('introFamiliarityNo');
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
        const mergedScenes = await prepareOverrides();
        const aiConfigured = await isAiConfigured();
        const randomAiAssigned = Math.random() < 0.5;
        const aiAssigned = forcedVariant === 'NORMAL'
            ? false
            : (forcedVariant === 'AI' ? true : randomAiAssigned);
        const effectiveAiEnabled = forcedVariant === 'NORMAL'
            ? false
            : (aiConfigured ? true : aiAssigned);
        gameState.setAiEnabled(effectiveAiEnabled);
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

        const restartGame = async () => {
            localStorage.removeItem('newsgame-ai-mask-seen');
            localStorage.removeItem('newsgame-tutorial-shop-hint-seen');
            const mergedScenes = await prepareOverrides();
            gameRouter.init(mergedScenes, 'tutorial_intro');
            newsBoard.restart(); // 重启新闻看板
            gameState.setPlayerName('');
            gameState.setAiEnabled(false);
            gameState.setAiConfigured(false);
            gameState.setTelemetryActive(false);
            gameState.setLastMousePos(null);
            gameState.setWildfireFamiliarity('');
            gameState.setPreSurvey({});
            setStatsVisibility(false);
            updateStatsPanel();
            if (introModal) introModal.style.display = 'flex';
            if (introInput) introInput.value = '';
            clearSurveyForm();
            showIntroStep('name');
            if (introBtn) introBtn.disabled = false;
            if (introNextBtn) introNextBtn.disabled = false;
        };

        // 绑定重新开始按钮
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                restartGame();
            });
        }

        // 添加键盘快捷键支持（可选）
        document.addEventListener('keydown', (e) => {
            // 按 R 键重新开始
            if (e.key === 'r' || e.key === 'R') {
                const footer = document.getElementById('footer');
                if (footer.style.display !== 'none') {
                    restartGame();
                }
            }

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
