/**
 * 应用入口文件
 * 负责初始化游戏和绑定事件
 */

import { scenes } from './scenes.js';
import { gameRouter } from './router.js';
import { newsBoard } from './newsBoard.js';
import { setLanguage, getLanguage, onLanguageChange, t } from './i18n.js';
import { gameState } from './state.js';
import { updateStatsPanel, setStatsVisibility } from './ui.js';
import { isAiConfigured } from './aiClient.js';

const LANGUAGE_STORAGE_KEY = 'newsgame-lang';

function applyStaticText() {
    const titleEl = document.querySelector('.game-title');
    const restartBtn = document.getElementById('restart-btn');
    const boardTitle = document.querySelector('.news-board-title');
    const boardSub = document.querySelector('.news-board-sub');
    const languageLabel = document.querySelector('label[for=\"language-select\"]');
    const loadingEl = document.querySelector('#app .loading');
    const introTitle = document.querySelector('.intro-title');
    const introText = document.querySelector('.intro-text');
    const introLabel = document.querySelector('.intro-label');
    const introInput = document.getElementById('player-name-input');
    const introBtn = document.getElementById('intro-start-btn');
    const statsTitle = document.querySelector('.stats-title');
    const statsReporter = document.getElementById('stats-label-reporter');
    const statsScore = document.getElementById('stats-label-score');
    const statsClicks = document.getElementById('stats-label-clicks');
    const statsDistance = document.getElementById('stats-label-distance');
    const statsAi = document.getElementById('stats-label-ai');
    const statsChoices = document.getElementById('stats-label-choices');

    document.title = t('gameTitle');
    if (titleEl) titleEl.textContent = t('gameTitle');
    if (restartBtn) restartBtn.textContent = t('restart');
    if (boardTitle) boardTitle.textContent = t('liveBoardTitle');
    if (boardSub) boardSub.textContent = t('liveBoardSub');
    if (languageLabel) languageLabel.textContent = t('languageLabel');
    if (loadingEl) loadingEl.textContent = t('loading');
    if (introTitle) introTitle.textContent = t('introTitle');
    if (introText) introText.textContent = t('introBody');
    if (introLabel) introLabel.textContent = t('introNameLabel');
    if (introInput) introInput.placeholder = t('introNamePlaceholder');
    if (introBtn) introBtn.textContent = t('introStart');
    if (statsTitle) statsTitle.textContent = t('statsTitle');
    if (statsReporter) statsReporter.textContent = t('statsReporter');
    if (statsScore) statsScore.textContent = t('statsScore');
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
    const introBtn = document.getElementById('intro-start-btn');

    const startGame = async (playerName, forcedVariant) => {
        if (introBtn) {
            introBtn.disabled = true;
        }
        if (introModal) introModal.style.display = 'none';
        setStatsVisibility(false);

        // 初始化游戏路由
        gameRouter.init(scenes, 'intro');
        if (playerName) {
            gameState.setPlayerName(playerName);
        }
        let aiAssigned = Math.random() < 0.5;
        if (forcedVariant === 'AI') aiAssigned = true;
        if (forcedVariant === 'NORMAL') aiAssigned = false;
        gameState.setAiEnabled(aiAssigned);
        if (forcedVariant) {
            gameState.setPlayerName(forcedVariant);
        }
        gameState.setAiConfigured(await isAiConfigured());
        gameState.startSession();
        gameState.setTelemetryActive(true);
        gameState.setLastMousePos(null);
        updateStatsPanel();

        // 初始化新闻看板
        newsBoard.init();

        const restartGame = async () => {
            gameRouter.restart();
            newsBoard.restart(); // 重启新闻看板
            gameState.setPlayerName('');
            gameState.setAiEnabled(false);
            gameState.setAiConfigured(false);
            gameState.setTelemetryActive(false);
            gameState.setLastMousePos(null);
            setStatsVisibility(false);
            updateStatsPanel();
            if (introModal) introModal.style.display = 'flex';
            if (introInput) introInput.value = '';
            if (introBtn) introBtn.disabled = false;
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
                const currentScene = gameRouter.getCurrentScene();
                if (currentScene && currentScene.choices && currentScene.choices[num - 1]) {
                    const choice = currentScene.choices[num - 1];
                    gameRouter.handleChoice(choice);
                }
            }
        });
    };

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
            startGame(name, forcedVariant);
        });
    }
    if (introInput) {
        introInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
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
