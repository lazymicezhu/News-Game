/**
 * 应用入口文件
 * 负责初始化游戏和绑定事件
 */

import { scenes } from './scenes.js';
import { gameRouter } from './router.js';
import { newsBoard } from './newsBoard.js';

/**
 * 初始化应用
 */
function init() {
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
