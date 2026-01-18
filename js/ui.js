import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';
import { t, localize, getLanguage } from './i18n.js';

/**
 * 渲染场景
 * @param {Object} scene - 场景对象
 * @param {Function} onChoice - 选择回调函数
 */
export function renderScene(scene, onChoice) {
    const appElement = document.getElementById('app');

    if (!scene) {
        appElement.innerHTML = `<div class="loading">${t('sceneNotFound')}</div>`;
        return;
    }

    const sceneDiv = document.createElement('div');
    sceneDiv.className = 'scene';

    // 图片
    if (scene.image) {
        const image = document.createElement('img');
        image.src = scene.image;
        image.alt = localize(scene.title) || 'scene';
        image.className = 'scene-image';
        sceneDiv.appendChild(image);
    }

    // 标题
    if (scene.title) {
        const title = document.createElement('h2');
        title.className = 'scene-title';
        title.textContent = localize(scene.title);
        sceneDiv.appendChild(title);
    }

    // 正文
    if (scene.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'scene-text';
        textDiv.textContent = localize(scene.text);
        sceneDiv.appendChild(textDiv);
    }
    
    // 选项
    if (scene.choices && scene.choices.length > 0) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices';

        scene.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.textContent = localize(choice.text);
            if (choice.hint) {
                button.title = localize(choice.hint);
            }
            button.onclick = () => onChoice(choice, index);
            choicesDiv.appendChild(button);
        });

        sceneDiv.appendChild(choicesDiv);
    } else {
        sceneDiv.classList.add('ending');
        showFooter();
        renderRecap(sceneDiv);
    }

    // 替换内容
    appElement.innerHTML = '';
    appElement.appendChild(sceneDiv);

    // 助手浮层
    renderAssistant();
}

/**
 * 助手浮层（派蒙）
 */
function renderAssistant() {
    let assistant = document.getElementById('assistant');
    if (!assistant) {
        assistant = document.createElement('div');
        assistant.id = 'assistant';
        assistant.innerHTML = `
            <div class="assistant-avatar">
                <img src="arts/派蒙1.jpeg" alt="assistant">
            </div>
            <div class="assistant-bubble">
                <div class="assistant-text">${t('assistantFallback')}</div>
            </div>
        `;
        document.body.appendChild(assistant);
    }

    const bubble = assistant.querySelector('.assistant-bubble');
    const textEl = assistant.querySelector('.assistant-text');

    // 始终显示助手：每个场景刷新一句
    assistant.style.display = 'flex';
    const pool = assistantLines[getLanguage()] || [];
    const line = gameState.nextAssistantLine(pool) || t('assistantFallback');
    textEl.textContent = line;

    bubble.classList.add('assistant-pop');
    setTimeout(() => bubble.classList.remove('assistant-pop'), 300);
}

/**
 * 显示加载状态
 */
export function showLoading() {
    const appElement = document.getElementById('app');
    appElement.innerHTML = `<div class="loading">${t('loading')}</div>`;
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
export function showError(message) {
    const appElement = document.getElementById('app');
    appElement.innerHTML = `<div class="loading">${t('errorPrefix')}: ${message}</div>`;
}

/**
 * 显示 Footer
 */
export function showFooter() {
    const footer = document.getElementById('footer');
    footer.style.display = 'block';
}

/**
 * 隐藏 Footer
 */
export function hideFooter() {
    const footer = document.getElementById('footer');
    footer.style.display = 'none';
}

/**
 * 更新进度条
 * @param {number} progress - 进度百分比 (0-100)
 */
export function updateProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');

    if (progress > 0) {
        progressBar.style.display = 'block';
        progressFill.style.width = `${progress}%`;
    } else {
        progressBar.style.display = 'none';
    }
}

/**
 * 渲染流程图
 * @param {Object} scenes - 所有场景的集合
 * @param {Object} currentState - 当前游戏状态
 * @param {Function} onNodeClick - 节点点击回调
 */
export function renderFlowchart(scenes, currentState, onNodeClick) {
    const flowchartContainer = document.getElementById('flowchart-container');
    flowchartContainer.innerHTML = '';

    const title = document.createElement('h3');
    title.className = 'flowchart-title';
    title.textContent = t('storyLine');
    flowchartContainer.appendChild(title);

    currentState.history.forEach(sceneId => {
        const scene = scenes[sceneId];
        if (!scene) return;

        const node = document.createElement('div');
        node.className = 'flowchart-node';
        node.textContent = localize(scene.title) || scene.id;
        node.dataset.sceneId = scene.id;

        const isActive = currentState.currentSceneId === scene.id;
        node.classList.add('visited');

        if (isActive) {
            node.classList.add('active');
        }

        if (!isActive) {
            node.onclick = () => onNodeClick(scene.id);
        } else {
            node.style.cursor = 'default';
        }

        flowchartContainer.appendChild(node);
    });

    const currentScene = scenes[currentState.currentSceneId];
    if (currentScene && currentScene.choices) {
        currentScene.choices.forEach(choice => {
            if (choice.next && !currentState.history.includes(choice.next)) {
                const futureScene = scenes[choice.next];
                if (!futureScene) return;

                const futureNode = document.createElement('div');
                futureNode.className = 'flowchart-node future';
                futureNode.textContent = localize(futureScene.title) || futureScene.id;
                futureNode.style.marginLeft = '20px';

                flowchartContainer.appendChild(futureNode);
            }
        });
    }
}

/**
 * 结局回顾：生成报道摘要与决策清单
 */
function renderRecap(sceneContainer) {
    const recap = document.createElement('div');
    recap.className = 'recap-panel';

    const title = document.createElement('h3');
    title.textContent = t('recapTitle');
    recap.appendChild(title);

    const state = gameState.getState();
    const decisions = state.decisions || [];

    const summary = document.createElement('div');
    summary.className = 'recap-summary';
    summary.innerHTML = buildSummary(decisions);
    recap.appendChild(summary);

    const listTitle = document.createElement('h4');
    listTitle.textContent = t('recapDecisions');
    recap.appendChild(listTitle);

    const list = document.createElement('ul');
    list.className = 'decision-list';
    decisions.forEach(entry => {
        const li = document.createElement('li');
        const sceneLabel = entry.sceneTitleIntl ? localize(entry.sceneTitleIntl) : (entry.sceneTitle || entry.sceneId);
        const choiceLabel = entry.choiceIntl ? localize(entry.choiceIntl) : entry.choiceText;
        li.textContent = t('decisionEntry', sceneLabel, choiceLabel);
        list.appendChild(li);
    });
    recap.appendChild(list);

    sceneContainer.appendChild(recap);
}

function buildSummary(decisions) {
    if (!decisions.length) return t('noDecisions');

    const leaningCount = {};
    decisions.forEach(d => {
        if (d.effect && d.effect.angle) {
            leaningCount[d.effect.angle] = (leaningCount[d.effect.angle] || 0) + 1;
        }
    });
    const topAngle = Object.entries(leaningCount).sort((a, b) => b[1] - a[1])[0];
    const angleText = topAngle ? translateAngle(topAngle[0]) : t('angleUnknown');

    return t('summaryText', angleText, decisions.length);
}

function translateAngle(angle) {
    const map = {
        official: t('angleOfficial'),
        community: t('angleCommunity'),
        hype: t('angleHype'),
        balanced: t('angleBalanced')
    };
    return map[angle] || angle;
}
