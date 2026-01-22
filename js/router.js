/**
 * 路由和状态机模块
 * 负责场景跳转和游戏流程控制
 */

import { gameState } from './state.js';
import { renderScene, showError, hideFooter, renderFlowchart, updateStatsPanel } from './ui.js';
import { localize, t } from './i18n.js';

const MIN_DECISIONS_TO_END = 10;
const EXTENDED_SCENES = [
    'press_pool',
    'air_quality',
    'relief_org',
    'supply_convoy',
    'data_desk',
    'county_hotline',
    'hospital_visit'
];

function isEndingScene(scene) {
    return !(scene && Array.isArray(scene.choices) && scene.choices.length > 0);
}

function getExtendedSceneId(decisionCount) {
    if (!EXTENDED_SCENES.length) return null;
    const index = Math.max(0, decisionCount) % EXTENDED_SCENES.length;
    return EXTENDED_SCENES[index];
}

class GameRouter {
    constructor() {
        this.scenes = null;
        this.startSceneId = 'intro';
    }

    /**
     * 初始化路由
     * @param {Object} scenes - 场景数据对象
     * @param {string} startSceneId - 起始场景ID
     */
    init(scenes, startSceneId = 'intro') {
        this.scenes = scenes;
        this.startSceneId = startSceneId;
        gameState.init(startSceneId);
        // 手动将第一个场景加入历史
        gameState.history.push(startSceneId);
        this.goTo(startSceneId);
    }

    /**
     * 跳转到指定场景
     * @param {string} sceneId - 场景ID
     */
    goTo(sceneId) {
        if (!this.scenes) {
            showError(t('sceneNotFound'));
            return;
        }

        const scene = this.scenes[sceneId];

        if (!scene) {
            showError(t('sceneNotFound'));
            return;
        }

        // 更新当前场景ID用于渲染
        gameState.setCurrentScene(sceneId);

        // 渲染UI
        hideFooter();
        renderScene(scene, (choice) => this.handleChoice(choice));
        renderFlowchart(this.scenes, gameState.getState(), (id) => this.goTo(id));
    }

    /**
     * 处理选择
     * @param {Object} choice - 选择对象
     */
    handleChoice(choice) {
        // 检查是否从历史记录中的某个点产生了新的分支
        const { history, currentSceneId } = gameState.getState();
        if (history[history.length - 1] !== currentSceneId) {
            // 是的，用户回溯并做出了不同的选择
            // 截断历史记录
            gameState.truncateHistory(currentSceneId);
            // 注意: 这里我们没有清理未来的变量，这是一个简化的实现
        }

        // 记录决策
        const currentScene = this.scenes[currentSceneId];
        gameState.logDecision({
            sceneId: currentSceneId,
            sceneTitle: currentScene ? localize(currentScene.title) : currentSceneId,
            sceneTitleIntl: currentScene ? currentScene.title : null,
            choiceText: localize(choice.text),
            choiceIntl: choice.text,
            effect: choice.effect || {},
            tags: choice.tags || []
        });
        updateStatsPanel();

        // 应用选择效果
        if (choice.effect) {
            gameState.applyEffect(choice.effect);
        }

        // 跳转到下一个场景
        if (choice.next) {
            let nextSceneId = choice.next;
            const targetScene = this.scenes ? this.scenes[nextSceneId] : null;
            if (targetScene && isEndingScene(targetScene) && gameState.decisions.length < MIN_DECISIONS_TO_END) {
                const extendedSceneId = getExtendedSceneId(gameState.decisions.length);
                if (extendedSceneId && this.scenes[extendedSceneId]) {
                    nextSceneId = extendedSceneId;
                }
            }
            // 将新场景加入历史
            gameState.history.push(nextSceneId);
            this.goTo(nextSceneId);
        }
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.init(this.scenes, this.startSceneId);
    }

    /**
     * 获取当前场景
     * @returns {Object} 当前场景对象
     */
    getCurrentScene() {
        const sceneId = gameState.currentSceneId;
        return this.scenes ? this.scenes[sceneId] : null;
    }

    rerenderCurrent() {
        if (this.scenes && gameState.currentSceneId) {
            this.goTo(gameState.currentSceneId);
        }
    }
}

// 导出单例
export const gameRouter = new GameRouter();
