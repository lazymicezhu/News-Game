/**
 * 应用入口文件
 * 负责初始化游戏和绑定事件
 */

import { scenes } from './scenes.js';
import { gameRouter } from './router.js';
import { newsBoard } from './newsBoard.js';
import { setLanguage, getLanguage, onLanguageChange, t } from './i18n.js';
import { gameState } from './state.js';

const LANGUAGE_STORAGE_KEY = 'newsgame-lang';

function applyStaticText() {
    const titleEl = document.querySelector('.game-title');
    const restartBtn = document.getElementById('restart-btn');
    const boardTitle = document.querySelector('.news-board-title');
    const boardSub = document.querySelector('.news-board-sub');
    const languageLabel = document.querySelector('label[for=\"language-select\"]');
    const loadingEl = document.querySelector('#app .loading');

    document.title = t('gameTitle');
    if (titleEl) titleEl.textContent = t('gameTitle');
    if (restartBtn) restartBtn.textContent = t('restart');
    if (boardTitle) boardTitle.textContent = t('liveBoardTitle');
    if (boardSub) boardSub.textContent = t('liveBoardSub');
    if (languageLabel) languageLabel.textContent = t('languageLabel');
    if (loadingEl) loadingEl.textContent = t('loading');
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

/**
 * 初始化应用
 */
function init() {
    setupLanguage();

    // 初始化游戏路由
    gameRouter.init(scenes, 'intro');

    // 初始化新闻看板
    newsBoard.init();

    // 绑定重新开始按钮
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            gameRouter.restart();
            newsBoard.restart(); // 重启新闻看板
        });
    }

    // 添加键盘快捷键支持（可选）
    document.addEventListener('keydown', (e) => {
        // 按 R 键重新开始
        if (e.key === 'r' || e.key === 'R') {
            const footer = document.getElementById('footer');
            if (footer.style.display !== 'none') {
                gameRouter.restart();
                newsBoard.restart(); // 重启新闻看板
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
