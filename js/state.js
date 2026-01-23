/**
 * 全局状态管理模块
 * 负责管理游戏状态变量和玩家选择
 */

class GameState {
    constructor() {
        this.currentSceneId = null;
        this.variables = {};
        this.history = [];
        this.decisions = [];
        this.assistantPool = [];
        this.playerName = '';
        this.clickCount = 0;
        this.mouseDistance = 0;
        this.aiInteractions = 0;
        this.lastMousePos = null;
        this.telemetryActive = false;
        this.sessionStart = null;
        this.aiLogs = [];
        this.aiEnabled = false;
        this.clickPoints = [];
        this.currentSceneImage = '';
        this.aiConfigured = false;
        this.nonAiHints = {};
        this.nonAiLogs = [];
        this.newsValue = 60;
        this.wildfireFamiliarity = '';
    }

    /**
     * 初始化状态
     * @param {string} startSceneId - 起始场景ID
     */
    init(startSceneId = 'intro') {
        this.currentSceneId = startSceneId;
        this.variables = {};
        this.history = [];
        this.decisions = [];
        this.assistantPool = [];
        this.playerName = '';
        this.clickCount = 0;
        this.mouseDistance = 0;
        this.aiInteractions = 0;
        this.lastMousePos = null;
        this.telemetryActive = false;
        this.sessionStart = null;
        this.aiLogs = [];
        this.aiEnabled = false;
        this.clickPoints = [];
        this.currentSceneImage = '';
        this.aiConfigured = false;
        this.nonAiHints = {};
        this.nonAiLogs = [];
        this.newsValue = 60;
        this.wildfireFamiliarity = '';
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态对象
     */
    getState() {
        return {
            currentSceneId: this.currentSceneId,
            variables: { ...this.variables },
            history: [...this.history],
            decisions: [...this.decisions],
            playerName: this.playerName,
            clickCount: this.clickCount,
            mouseDistance: this.mouseDistance,
            aiInteractions: this.aiInteractions,
            telemetryActive: this.telemetryActive,
            sessionStart: this.sessionStart,
            aiLogs: [...this.aiLogs],
            aiEnabled: this.aiEnabled,
            aiConfigured: this.aiConfigured,
            nonAiLogs: [...this.nonAiLogs],
            clickPoints: [...this.clickPoints],
            currentSceneImage: this.currentSceneImage,
            newsValue: this.newsValue,
            wildfireFamiliarity: this.wildfireFamiliarity
        };
    }

    /**
     * 设置当前场景ID
     * @param {string} sceneId - 场景ID
     */
    setCurrentScene(sceneId) {
        this.currentSceneId = sceneId;
    }

    /**
     * 设置变量
     * @param {string} key - 变量名
     * @param {*} value - 变量值
     */
    setVariable(key, value) {
        this.variables[key] = value;
    }

    /**
     * 获取变量
     * @param {string} key - 变量名
     * @returns {*} 变量值
     */
    getVariable(key) {
        return this.variables[key];
    }

    startSession() {
        this.sessionStart = Date.now();
    }

    getSessionStart() {
        return this.sessionStart;
    }

    addAiLog(entry) {
        if (!entry) return;
        this.aiLogs.push({
            ...entry,
            timestamp: Date.now()
        });
    }

    setAiEnabled(enabled) {
        this.aiEnabled = !!enabled;
    }

    setTelemetryActive(active) {
        this.telemetryActive = !!active;
    }

    isTelemetryActive() {
        return this.telemetryActive;
    }

    setPlayerName(name) {
        this.playerName = name || '';
    }

    setWildfireFamiliarity(value) {
        this.wildfireFamiliarity = value || '';
    }

    incrementClick() {
        this.clickCount += 1;
    }

    addClickPoint(point) {
        if (!point) return;
        const { x, y } = point;
        if (typeof x !== 'number' || typeof y !== 'number') return;
        this.clickPoints.push({ x, y });
    }

    setCurrentSceneImage(image) {
        this.currentSceneImage = image || '';
    }

    setAiConfigured(configured) {
        this.aiConfigured = !!configured;
    }

    isAiConfigured() {
        return this.aiConfigured;
    }

    setNonAiHint(sceneId, hintText) {
        if (!sceneId) return;
        this.nonAiHints[sceneId] = hintText || '';
    }

    getNonAiHint(sceneId) {
        if (!sceneId) return undefined;
        return this.nonAiHints[sceneId];
    }

    addNonAiLog(entry) {
        if (!entry) return;
        this.nonAiLogs.push({
            ...entry,
            timestamp: Date.now()
        });
    }

    addMouseDistance(delta) {
        if (typeof delta !== 'number' || Number.isNaN(delta)) return;
        this.mouseDistance += Math.max(0, delta);
    }

    incrementAiInteractions() {
        this.aiInteractions += 1;
    }

    setLastMousePos(pos) {
        this.lastMousePos = pos;
    }

    getLastMousePos() {
        return this.lastMousePos;
    }

    /**
     * 应用选择效果
     * @param {Object} effect - 效果对象
     */
    applyEffect(effect) {
        if (!effect) return;

        for (const [key, value] of Object.entries(effect)) {
            this.setVariable(key, value);
        }
        if (typeof effect.newsValueDelta === 'number' && !Number.isNaN(effect.newsValueDelta)) {
            const nextValue = this.newsValue + effect.newsValueDelta;
            this.newsValue = Math.max(0, Math.min(100, Math.round(nextValue)));
        }
    }

    /**
     * 记录一次决策
     * @param {Object} entry - 包含场景、选项和影响描述
     */
    logDecision(entry) {
        if (!entry) return;
        this.decisions.push({
            ...entry,
            timestamp: Date.now()
        });
    }

    /**
     * 获取决策记录
     * @returns {Array} 决策列表
     */
    getDecisionLog() {
        return [...this.decisions];
    }

    /**
     * 从助手语句池中取下一句，不重复用完再洗牌
     * @param {Array<string>} sourceLines - 语料库
     * @returns {string|null}
     */
    nextAssistantLine(sourceLines = []) {
        if (!Array.isArray(sourceLines) || sourceLines.length === 0) return null;
        if (!this.assistantPool || this.assistantPool.length === 0) {
            this.assistantPool = this.shuffleArray([...sourceLines]);
        }
        return this.assistantPool.pop();
    }

    resetAssistantLines() {
        this.assistantPool = [];
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * 将历史记录截断到指定场景
     * @param {string} sceneId - 场景ID
     */
    truncateHistory(sceneId) {
        const index = this.history.lastIndexOf(sceneId);
        if (index > -1) {
            this.history = this.history.slice(0, index + 1);
        }
    }

    /**
     * 重置状态
     */
    reset() {
        this.init();
    }
}

// 导出单例
export const gameState = new GameState();
