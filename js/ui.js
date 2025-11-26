import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';
import { t, localize, getLanguage } from './i18n.js';

const trustColorMap = {
    high: '#16a34a',
    medium: '#f59e0b',
    low: '#ef4444'
};

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

    // 来源标签 + 不确定性提示
    if (scene.source) {
        const badge = buildSourceBadge(scene.source);
        sceneDiv.appendChild(badge);
    }

    if (scene.unverified) {
        const uncertain = document.createElement('div');
        uncertain.className = 'uncertainty-pill';
        uncertain.textContent = t('unverifiedWarning');
        sceneDiv.appendChild(uncertain);
    }

    // 正文
    if (scene.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'scene-text';
        if (scene.unverified) {
            textDiv.classList.add('unverified-text');
        }
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

    // 证据助手浮层逻辑
    renderEvidenceAssistant(scene.evidence || [], scene.id, localize(scene.title), scene.title);
}

/**
 * 来源徽章
 */
function buildSourceBadge(source) {
    const badge = document.createElement('div');
    badge.className = 'source-badge';
    badge.textContent = `[${localize(source.label)}]`;
    badge.title = localize(source.details) || 'info source';
    if (source.credibility && trustColorMap[source.credibility]) {
        badge.style.color = trustColorMap[source.credibility];
        badge.style.borderColor = trustColorMap[source.credibility];
    }
    return badge;
}

/**
 * 证据助手浮层（派蒙）
 */
function renderEvidenceAssistant(evidenceList, sceneId, sceneTitle, sceneTitleIntl) {
    let assistant = document.getElementById('assistant');
    if (!assistant) {
        assistant = document.createElement('div');
        assistant.id = 'assistant';
        assistant.innerHTML = `
            <div class="assistant-avatar">
                <img src="arts/派蒙1.jpeg" alt="assistant">
            </div>
            <div class="assistant-bubble">
                <div class="assistant-text">${t('assistantPrompt')}</div>
                <div class="assistant-evidence"></div>
            </div>
        `;
        document.body.appendChild(assistant);
    }

    const bubble = assistant.querySelector('.assistant-bubble');
    const evidenceContainer = assistant.querySelector('.assistant-evidence');
    const textEl = assistant.querySelector('.assistant-text');
    evidenceContainer.innerHTML = '';

    // 始终显示助手；如果无证据则提示等待
    assistant.style.display = 'flex';
    if (!evidenceList || evidenceList.length === 0) {
        const pool = assistantLines[getLanguage()] || [];
        const line = gameState.nextAssistantLine(pool) || t('assistantNoEvidence');
        textEl.textContent = line;
        bubble.classList.add('assistant-bubble--solo');
        toggleMinimizeButton(bubble, false);
        return;
    }

    bubble.classList.remove('assistant-bubble--solo');
    textEl.textContent = t('assistantPrompt');
    toggleMinimizeButton(bubble, true);
    const marks = gameState.getEvidenceMarks();

    evidenceList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'assistant-card';

        const title = document.createElement('div');
        title.className = 'assistant-card-title';
        title.textContent = localize(item.title);
        card.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'assistant-card-desc';
        desc.textContent = localize(item.content);
        card.appendChild(desc);

        const level = document.createElement('div');
        level.className = 'assistant-card-level';
        level.textContent = item.credibility ? `${t('credibilityLabel')}${localize(item.credibility)}` : t('credibilityUnknown');
        card.appendChild(level);

        const actions = document.createElement('div');
        actions.className = 'assistant-actions';

        ['trusted', 'doubtful', 'viewed'].forEach(status => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary evidence-btn';
            btn.textContent = translateStatus(status);
            btn.onclick = () => {
                gameState.markEvidence(item.id, status, {
                    sceneId,
                    sceneTitle,
                    sceneTitleIntl,
                    title: localize(item.title),
                    titleIntl: item.title
                });
                renderAssistantStatus(card, item.id);
                // 判断后隐藏选择框
                const actionsContainer = card.querySelector('.assistant-actions');
                if (actionsContainer) {
                    actionsContainer.style.display = 'none';
                }
            };
            actions.appendChild(btn);
        });

        card.appendChild(actions);
        renderAssistantStatus(card, item.id, marks);
        evidenceContainer.appendChild(card);
    });

    bubble.classList.add('assistant-pop');
    setTimeout(() => bubble.classList.remove('assistant-pop'), 300);

    const avatar = assistant.querySelector('.assistant-avatar');
    avatar.onclick = () => {
        toggleHistoryPanel();
    };
}

function renderAssistantStatus(card, evidenceId, marksInput) {
    const marks = marksInput || gameState.getEvidenceMarks();
    const previous = card.querySelector('.assistant-status');
    if (previous) previous.remove();
    const statusData = marks[evidenceId];
    const statusDiv = document.createElement('div');
    statusDiv.className = 'assistant-status';
    if (statusData) {
        statusDiv.textContent = `${t('yourMark')}${translateStatus(statusData.status)}`;
        statusDiv.classList.add(`status-${statusData.status}`);
    } else {
        statusDiv.textContent = t('unmarked');
    }
    card.appendChild(statusDiv);
}

function translateStatus(status) {
    if (status === 'trusted') return t('statusTrusted');
    if (status === 'doubtful') return t('statusDoubtful');
    if (status === 'viewed') return t('statusViewed');
    return status;
}

function toggleHistoryPanel() {
    let panel = document.getElementById('assistant-history');
    const bubble = document.querySelector('#assistant .assistant-bubble');
    const avatar = document.querySelector('#assistant .assistant-avatar');
    const syncHeader = (container) => {
        if (!container) return;
        const titleSpan = container.querySelector('.history-header span');
        const closeBtn = container.querySelector('.history-close');
        if (titleSpan) titleSpan.textContent = t('markedEvidence');
        if (closeBtn) closeBtn.setAttribute('aria-label', t('close'));
    };
    if (panel) {
        syncHeader(panel);
        const isOpen = panel.classList.contains('open');
        panel.classList.toggle('open', !isOpen);
        if (!isOpen) {
            renderHistoryBody(panel);
            if (bubble) bubble.style.display = 'none';
        } else {
            if (bubble) bubble.style.display = '';
        }
        return;
    }

    panel = document.createElement('div');
    panel.id = 'assistant-history';
    panel.innerHTML = `
        <div class="history-header">
            <span>${t('markedEvidence')}</span>
            <button class="history-close" aria-label="${t('close')}">×</button>
        </div>
        <div class="history-body"></div>
    `;
    document.body.appendChild(panel);
    const closeBtn = panel.querySelector('.history-close');
    closeBtn.onclick = () => {
        panel.classList.remove('open');
        if (bubble) bubble.style.display = '';
    };

    syncHeader(panel);
    renderHistoryBody(panel);
    panel.classList.add('open');
    if (bubble) bubble.style.display = 'none';
}

function toggleMinimizeButton(bubble, show) {
    if (!bubble) return;
    const existing = bubble.querySelector('.assistant-minimize');
    if (show) {
        if (existing) {
            existing.style.display = 'flex';
            const minimized = bubble.classList.contains('assistant-minimized');
            existing.title = minimized ? t('assistantExpand') : t('assistantMinimize');
            existing.innerHTML = minimized ? '+' : '−';
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'assistant-minimize';
        btn.title = t('assistantMinimize');
        btn.innerHTML = '−';
        btn.onclick = () => {
            const minimized = bubble.classList.toggle('assistant-minimized');
            if (minimized) {
                btn.title = t('assistantExpand');
                btn.innerHTML = '+';
            } else {
                btn.title = t('assistantMinimize');
                btn.innerHTML = '−';
            }
        };
        bubble.appendChild(btn);
    } else if (existing) {
        existing.style.display = 'none';
        bubble.classList.remove('assistant-minimized');
    }
}


function renderHistoryBody(panel) {
    const body = panel.querySelector('.history-body');
    body.innerHTML = '';
    const marks = gameState.getEvidenceMarks();
    const entries = Object.entries(marks);

    if (!entries.length) {
        body.textContent = t('noEvidenceMarks');
        return;
    }

    entries.forEach(([id, meta]) => {
        const row = document.createElement('div');
        row.className = 'history-row';
        const title = meta.titleIntl ? localize(meta.titleIntl) : (meta.title || id);
        const sceneLabelRaw = meta.sceneTitleIntl ? localize(meta.sceneTitleIntl) : (meta.sceneTitle || meta.sceneId || '');
        const sceneLabel = sceneLabelRaw
            ? (getLanguage() === 'zh' ? `（场景：${sceneLabelRaw}）` : `(Scene: ${sceneLabelRaw})`)
            : '';
        row.innerHTML = `
            <div class="history-title">${title}</div>
            <div class="history-scene">${sceneLabel}</div>
            <div class="history-status status-${meta.status}">${translateStatus(meta.status)}</div>
        `;
        body.appendChild(row);
    });
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
    const marks = state.evidenceMarks || {};

    const summary = document.createElement('div');
    summary.className = 'recap-summary';
    summary.innerHTML = buildSummary(decisions, marks);
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

    const evidenceTitle = document.createElement('h4');
    evidenceTitle.textContent = t('evidenceMarks');
    recap.appendChild(evidenceTitle);

    const evidenceInfo = document.createElement('div');
    evidenceInfo.className = 'evidence-summary';
    const counters = countEvidenceMarks(marks);
    evidenceInfo.textContent = `${t('trustedCount')}: ${counters.trusted} · ${t('doubtfulCount')}: ${counters.doubtful} · ${t('viewedCount')}: ${counters.viewed}`;
    recap.appendChild(evidenceInfo);

    sceneContainer.appendChild(recap);
}

function buildSummary(decisions, marks) {
    if (!decisions.length) return t('noDecisions');

    const unverifiedCount = decisions.filter(d => d.unverified).length;
    const leaningCount = {};
    decisions.forEach(d => {
        if (d.effect && d.effect.angle) {
            leaningCount[d.effect.angle] = (leaningCount[d.effect.angle] || 0) + 1;
        }
    });
    const topAngle = Object.entries(leaningCount).sort((a, b) => b[1] - a[1])[0];
    const angleText = topAngle ? translateAngle(topAngle[0]) : t('angleUnknown');

    const trustScore = calculateTrustScore(decisions, marks);

    return t('summaryText', angleText, unverifiedCount, trustScore);
}

function calculateTrustScore(decisions, marks) {
    let score = 65;
    decisions.forEach(d => {
        if (d.effect && typeof d.effect.trustDelta === 'number') {
            score += d.effect.trustDelta;
        }
        if (d.unverified) score -= 6;
    });
    const markValues = Object.values(marks || {});
    if (markValues.some(m => m.status === 'trusted')) score += 4;
    if (markValues.some(m => m.status === 'doubtful')) score += 2; // 有质疑意识也加分
    return Math.min(100, Math.max(10, score));
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

function countEvidenceMarks(marks) {
    const initial = { trusted: 0, doubtful: 0, viewed: 0 };
    return Object.values(marks || {}).reduce((acc, cur) => {
        if (acc[cur.status] !== undefined) {
            acc[cur.status] += 1;
        }
        return acc;
    }, initial);
}
