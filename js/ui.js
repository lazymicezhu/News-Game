import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';

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
        appElement.innerHTML = '<div class="loading">场景未找到</div>';
        return;
    }

    const sceneDiv = document.createElement('div');
    sceneDiv.className = 'scene';

    // 图片
    if (scene.image) {
        const image = document.createElement('img');
        image.src = scene.image;
        image.alt = scene.title || '场景图片';
        image.className = 'scene-image';
        sceneDiv.appendChild(image);
    }

    // 标题
    if (scene.title) {
        const title = document.createElement('h2');
        title.className = 'scene-title';
        title.textContent = scene.title;
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
        uncertain.textContent = '尚未证实 · 请谨慎';
        sceneDiv.appendChild(uncertain);
    }

    // 正文
    if (scene.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'scene-text';
        if (scene.unverified) {
            textDiv.classList.add('unverified-text');
        }
        textDiv.textContent = scene.text;
        sceneDiv.appendChild(textDiv);
    }
    
    // 选项
    if (scene.choices && scene.choices.length > 0) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices';

        scene.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.textContent = choice.text;
            if (choice.hint) {
                button.title = choice.hint;
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
    renderEvidenceAssistant(scene.evidence || [], scene.id, scene.title);
}

/**
 * 来源徽章
 */
function buildSourceBadge(source) {
    const badge = document.createElement('div');
    badge.className = 'source-badge';
    badge.textContent = `[${source.label}]`;
    badge.title = source.details || '信息来源';
    if (source.credibility && trustColorMap[source.credibility]) {
        badge.style.color = trustColorMap[source.credibility];
        badge.style.borderColor = trustColorMap[source.credibility];
    }
    return badge;
}

/**
 * 证据助手浮层（派蒙）
 */
function renderEvidenceAssistant(evidenceList, sceneId, sceneTitle) {
    let assistant = document.getElementById('assistant');
    if (!assistant) {
        assistant = document.createElement('div');
        assistant.id = 'assistant';
        assistant.innerHTML = `
            <div class="assistant-avatar">
                <img src="arts/派蒙1.jpeg" alt="智能助理">
            </div>
            <div class="assistant-bubble">
                <div class="assistant-text">这里有证据，你的判断是？</div>
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
        const line = gameState.nextAssistantLine(assistantLines) || '当前没有证据卡片，我会继续帮你关注。';
        textEl.textContent = line;
        bubble.classList.add('assistant-bubble--solo');
        toggleMinimizeButton(bubble, false);
        return;
    }

    bubble.classList.remove('assistant-bubble--solo');
    textEl.textContent = '这里有证据，你的判断是？';
    toggleMinimizeButton(bubble, true);
    const marks = gameState.getEvidenceMarks();

    evidenceList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'assistant-card';

        const title = document.createElement('div');
        title.className = 'assistant-card-title';
        title.textContent = item.title;
        card.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'assistant-card-desc';
        desc.textContent = item.content;
        card.appendChild(desc);

        const level = document.createElement('div');
        level.className = 'assistant-card-level';
        level.textContent = item.credibility ? `来源可信度：${item.credibility}` : '来源可信度：未标注';
        card.appendChild(level);

        const actions = document.createElement('div');
        actions.className = 'assistant-actions';

        ['trusted', 'doubtful', 'viewed'].forEach(status => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary evidence-btn';
            btn.textContent = status === 'trusted' ? '相信' : status === 'doubtful' ? '存疑' : '已阅';
            btn.onclick = () => {
                gameState.markEvidence(item.id, status, { sceneId, sceneTitle, title: item.title });
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
        statusDiv.textContent = `你的标记：${translateStatus(statusData.status)}`;
        statusDiv.classList.add(`status-${statusData.status}`);
    } else {
        statusDiv.textContent = '未标记';
    }
    card.appendChild(statusDiv);
}

function translateStatus(status) {
    if (status === 'trusted') return '相信';
    if (status === 'doubtful') return '存疑';
    if (status === 'viewed') return '已阅';
    return status;
}

function toggleHistoryPanel() {
    let panel = document.getElementById('assistant-history');
    const bubble = document.querySelector('#assistant .assistant-bubble');
    const avatar = document.querySelector('#assistant .assistant-avatar');
    if (panel) {
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
            <span>已标记的证据</span>
            <button class="history-close" aria-label="关闭">×</button>
        </div>
        <div class="history-body"></div>
    `;
    document.body.appendChild(panel);
    const closeBtn = panel.querySelector('.history-close');
    closeBtn.onclick = () => {
        panel.classList.remove('open');
        if (bubble) bubble.style.display = '';
    };

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
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'assistant-minimize';
        btn.title = '最小化';
        btn.innerHTML = '−';
        btn.onclick = () => {
            const minimized = bubble.classList.toggle('assistant-minimized');
            if (minimized) {
                btn.title = '展开';
                btn.innerHTML = '+';
            } else {
                btn.title = '最小化';
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
        body.textContent = '还没有标记过证据。';
        return;
    }

    entries.forEach(([id, meta]) => {
        const row = document.createElement('div');
        row.className = 'history-row';
        const title = meta.title || id;
        const sceneLabel = meta.sceneTitle || meta.sceneId || '';
        row.innerHTML = `
            <div class="history-title">${title}</div>
            <div class="history-scene">${sceneLabel ? `（场景：${sceneLabel}）` : ''}</div>
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
    appElement.innerHTML = '<div class="loading">加载中...</div>';
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
export function showError(message) {
    const appElement = document.getElementById('app');
    appElement.innerHTML = `<div class="loading">错误: ${message}</div>`;
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
    title.textContent = '故事线';
    flowchartContainer.appendChild(title);

    currentState.history.forEach(sceneId => {
        const scene = scenes[sceneId];
        if (!scene) return;

        const node = document.createElement('div');
        node.className = 'flowchart-node';
        node.textContent = scene.title || scene.id;
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
                futureNode.textContent = futureScene.title || futureScene.id;
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
    title.textContent = '你的报道摘要';
    recap.appendChild(title);

    const state = gameState.getState();
    const decisions = state.decisions || [];
    const marks = state.evidenceMarks || {};

    const summary = document.createElement('div');
    summary.className = 'recap-summary';
    summary.innerHTML = buildSummary(decisions, marks);
    recap.appendChild(summary);

    const listTitle = document.createElement('h4');
    listTitle.textContent = '关键决策回放';
    recap.appendChild(listTitle);

    const list = document.createElement('ul');
    list.className = 'decision-list';
    decisions.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `在【${entry.sceneTitle || entry.sceneId}】，你选择：${entry.choiceText}`;
        list.appendChild(li);
    });
    recap.appendChild(list);

    const evidenceTitle = document.createElement('h4');
    evidenceTitle.textContent = '证据标记';
    recap.appendChild(evidenceTitle);

    const evidenceInfo = document.createElement('div');
    evidenceInfo.className = 'evidence-summary';
    const counters = countEvidenceMarks(marks);
    evidenceInfo.textContent = `相信: ${counters.trusted} · 存疑: ${counters.doubtful} · 已阅: ${counters.viewed}`;
    recap.appendChild(evidenceInfo);

    sceneContainer.appendChild(recap);
}

function buildSummary(decisions, marks) {
    if (!decisions.length) return '你还没有做出任何选择。';

    const unverifiedCount = decisions.filter(d => d.unverified).length;
    const leaningCount = {};
    decisions.forEach(d => {
        if (d.effect && d.effect.angle) {
            leaningCount[d.effect.angle] = (leaningCount[d.effect.angle] || 0) + 1;
        }
    });
    const topAngle = Object.entries(leaningCount).sort((a, b) => b[1] - a[1])[0];
    const angleText = topAngle ? translateAngle(topAngle[0]) : '尚未形成明显倾向';

    const trustScore = calculateTrustScore(decisions, marks);

    return `报道倾向：${angleText}。未证实信息使用 ${unverifiedCount} 次。综合可信度预估：${trustScore} / 100（越高代表引用来源越充分、标注越清晰）。`;
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
        official: '偏官方信息框架',
        community: '偏社区/人情叙事',
        hype: '偏流量/刺激取向',
        balanced: '平衡且求证'
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
