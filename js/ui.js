import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';
import { t, localize, getLanguage } from './i18n.js';
import { streamChat } from './aiClient.js';
import { getAiBackground, getRoleBackground, getAiPrompts } from './aiContext.js';
import { followupQuestions as defaultFollowupQuestions } from '../data/followupQuestions.js';
import { nonAiHints } from '../data/nonAiHints.js';
import { interviewRoles as defaultInterviewRoles } from '../data/interviewRoles.js';

let followupQuestions = defaultFollowupQuestions;
let interviewRoles = defaultInterviewRoles;

export function setFollowupQuestions(data) {
    if (data && typeof data === 'object') {
        followupQuestions = data;
    } else {
        followupQuestions = defaultFollowupQuestions;
    }
}

export function setInterviewRoles(data) {
    if (Array.isArray(data) && data.length) {
        interviewRoles = data;
    } else {
        interviewRoles = defaultInterviewRoles;
    }
}

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
    gameState.setCurrentSceneImage(scene.image || '');

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
        const score = typeof gameState.newsValue === 'number' ? gameState.newsValue : 60;
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'ending-score';
        scoreDiv.textContent = `${t('statsScore')}：${score} / 100`;
        sceneDiv.appendChild(scoreDiv);
        showFooter();
        finalizeStats();
    }

    // 替换内容
    appElement.innerHTML = '';
    appElement.appendChild(sceneDiv);

    // 助手浮层
    renderAssistant(scene, !(scene.choices && scene.choices.length === 0));
    updateStatsPanel();
}

/**
 * 助手浮层（派蒙）
 */
function renderAssistant(scene, showActions = true) {
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
                <div class="assistant-controls">
                    <button class="btn btn-secondary assistant-btn assistant-followup">${t('assistantFollowup')}</button>
                    <button class="btn btn-secondary assistant-btn assistant-interview">${t('assistantInterview')}</button>
                </div>
                <div class="assistant-followup-list"></div>
                <div class="assistant-panel">
                    <label class="assistant-label">${t('assistantRoleLabel')}</label>
                    <select class="assistant-role"></select>
                    <textarea class="assistant-input" rows="2" placeholder="${t('assistantQuestionPlaceholder')}"></textarea>
                    <button class="btn btn-primary assistant-send">${t('assistantSend')}</button>
                </div>
                <div class="assistant-stream">
                    <div class="assistant-stream-header">
                        <div class="assistant-stream-title">${t('assistantResponseTitle')}</div>
                        <div class="assistant-stream-status"></div>
                    </div>
                    <div class="assistant-stream-body"></div>
                </div>
            </div>
        `;
        document.body.appendChild(assistant);
    }

    const bubble = assistant.querySelector('.assistant-bubble');
    const textEl = assistant.querySelector('.assistant-text');
    const followupBtn = assistant.querySelector('.assistant-followup');
    const interviewBtn = assistant.querySelector('.assistant-interview');
    const followupList = assistant.querySelector('.assistant-followup-list');
    const panel = assistant.querySelector('.assistant-panel');
    const roleSelect = assistant.querySelector('.assistant-role');
    const inputEl = assistant.querySelector('.assistant-input');
    const sendBtn = assistant.querySelector('.assistant-send');
    const streamBody = assistant.querySelector('.assistant-stream-body');
    const streamTitle = assistant.querySelector('.assistant-stream-title');
    const streamStatus = assistant.querySelector('.assistant-stream-status');
    const controls = assistant.querySelector('.assistant-controls');

    // 始终显示助手：每个场景刷新一句
    assistant.style.display = 'flex';
    const pool = assistantLines[getLanguage()] || [];
    let line = gameState.nextAssistantLine(pool) || t('assistantFallback');

    const isEnding = !(scene && scene.choices && scene.choices.length > 0);
    const aiEnabled = gameState.getState().aiEnabled;
    const aiConfigured = gameState.getState().aiConfigured;
    if (!aiEnabled && scene && !isEnding) {
        const storedHint = gameState.getNonAiHint(scene.id);
        if (storedHint !== undefined) {
            if (storedHint) {
                line = storedHint;
            }
        } else {
            const showHint = Math.random() < 0.8;
            if (showHint) {
                const hints = nonAiHints[scene.id] || nonAiHints.default || [];
                const pick = hints[Math.floor(Math.random() * hints.length)];
                const hintText = pick ? localize(pick) : '';
                if (hintText) {
                    gameState.setNonAiHint(scene.id, hintText);
                    gameState.addNonAiLog({
                        sceneId: scene.id,
                        sceneTitle: localize(scene.title) || '',
                        hint: hintText
                    });
                    line = hintText;
                }
            }
        }
    }
    textEl.textContent = line;
    streamTitle.textContent = t('assistantResponseTitle');
    streamTitle.style.display = 'block';
    if (streamStatus) streamStatus.innerHTML = '';
    followupBtn.textContent = t('assistantFollowup');
    interviewBtn.textContent = t('assistantInterview');
    panel.querySelector('.assistant-label').textContent = t('assistantRoleLabel');
    renderInterviewRoles(roleSelect);
    inputEl.placeholder = t('assistantQuestionPlaceholder');
    sendBtn.textContent = t('assistantSend');
    const allowActions = showActions && aiEnabled && aiConfigured;
    if (controls) {
        controls.style.display = allowActions ? 'flex' : 'none';
    }
    if (!aiEnabled && !aiConfigured) {
        streamTitle.style.display = 'none';
        if (streamStatus) streamStatus.innerHTML = '';
    }
    followupList.classList.remove('open');
    panel.classList.remove('open');
    streamBody.textContent = '';
    if (assistant.aiAbort) {
        assistant.aiAbort.abort();
        assistant.aiAbort = null;
    }

    if (scene) {
        assistant.dataset.sceneTitle = localize(scene.title) || '';
        assistant.dataset.sceneText = localize(scene.text) || '';
        assistant.dataset.sceneId = scene.id || '';
        assistant.dataset.sceneChoices = JSON.stringify(
            (scene.choices || []).map(choice => localize(choice.text))
        );
    } else {
        assistant.dataset.sceneTitle = '';
        assistant.dataset.sceneText = '';
        assistant.dataset.sceneId = '';
        assistant.dataset.sceneChoices = '[]';
    }
    renderFollowupButtons(assistant, followupList, assistant.dataset.sceneId);

    bubble.classList.add('assistant-pop');
    setTimeout(() => bubble.classList.remove('assistant-pop'), 300);

    if (!assistant.dataset.bound) {
        assistant.dataset.bound = 'true';

        followupBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            followupList.classList.toggle('open');
            if (controls) controls.style.display = 'none';
            if (streamTitle) {
                streamTitle.textContent = t('assistantResponseTitle');
                streamTitle.style.display = 'block';
            }
        });

        interviewBtn.addEventListener('click', () => {
            panel.classList.toggle('open');
            if (controls) controls.style.display = 'none';
            if (streamTitle) {
                streamTitle.style.display = 'none';
            }
        });

        sendBtn.addEventListener('click', async () => {
            const question = inputEl.value.trim();
            if (!question) return;
            panel.classList.add('open');
            inputEl.value = '';
            await runInterview(assistant, streamBody, roleSelect.value, question);
        });
    }
}

function buildSceneContext(assistant) {
    const title = assistant.dataset.sceneTitle || '';
    const text = assistant.dataset.sceneText || '';
    let choices = [];
    try {
        choices = JSON.parse(assistant.dataset.sceneChoices || '[]');
    } catch {
        choices = [];
    }
    return { title, text, choices };
}

function resetStream(streamBody, message) {
    streamBody.textContent = message || '';
}

async function streamToElement(assistant, streamBody, messages, loadingText) {
    if (assistant.aiAbort) {
        assistant.aiAbort.abort();
    }
    assistant.aiAbort = new AbortController();
    resetStream(streamBody, loadingText || t('assistantThinking'));

    let hasToken = false;
    let fullText = '';
    try {
        await streamChat({
            messages,
            signal: assistant.aiAbort.signal,
            onToken: (token) => {
                if (!hasToken) {
                    streamBody.textContent = '';
                    hasToken = true;
                }
                fullText += token;
                streamBody.textContent += token;
            }
        });
        return fullText;
    } catch (err) {
        if (err?.name === 'AbortError') return;
        if (err?.message === 'AI_CONFIG_MISSING' || err?.message === 'AI_CONFIG_LOAD_FAILED') {
            streamBody.textContent = t('assistantConfigMissing');
        } else {
            streamBody.textContent = t('assistantRequestError');
        }
        return '';
    }
}

function renderFollowupButtons(assistant, followupList, sceneId) {
    followupList.innerHTML = '';
    const set = followupQuestions[sceneId] || followupQuestions.default || [];
    const list = set.slice(0, 3);
    list.forEach((question) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary assistant-followup-item';
        btn.type = 'button';
        btn.textContent = localize(question);
        btn.onclick = async () => {
            followupList.classList.remove('open');
            await runFollowupAnswer(assistant, followupList, question);
        };
        followupList.appendChild(btn);
    });
}

function setStatusTags(assistant) {
    const streamStatus = assistant.querySelector('.assistant-stream-status');
    if (!streamStatus) return;
    const tags = ['搜索最新消息', '核对信息完成', '思考中...'];
    const count = Math.random() < 0.5 ? 1 : 2;
    const picks = tags.sort(() => 0.5 - Math.random()).slice(0, count);
    streamStatus.innerHTML = picks.map(tag => `<span class="assistant-status-tag">${tag}</span>`).join('');
}

function renderInterviewRoles(selectEl) {
    if (!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = '';
    interviewRoles.forEach((role) => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = localize(role.label);
        selectEl.appendChild(option);
    });
    if (current) {
        selectEl.value = current;
    }
}

async function runFollowupAnswer(assistant, followupList, question) {
    const lang = getLanguage();
    const background = await getAiBackground();
    const prompts = getAiPrompts();
    const messages = [
        {
            role: 'system',
            content: lang === 'zh' ? prompts.followup.zh : prompts.followup.en
        },
        {
            role: 'user',
            content: [
                `${lang === 'zh' ? '背景' : 'Background'}: ${background || '-'}`,
                `${lang === 'zh' ? '追问' : 'Follow-up'}: ${localize(question)}`
            ].join('\n')
        }
    ];
    const streamBody = assistant.querySelector('.assistant-stream-body');
    const streamTitle = assistant.querySelector('.assistant-stream-title');
    if (streamTitle) {
        streamTitle.textContent = t('assistantResponseTitle');
        streamTitle.style.display = 'block';
    }
    setStatusTags(assistant);
    gameState.incrementAiInteractions();
    updateStatsPanel();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    assistant.dataset.requestId = requestId;
    const response = await streamToElement(assistant, streamBody, messages, t('assistantGenerating'));
    if (response) {
        gameState.addAiLog({
            type: 'followup',
            sceneId: assistant.dataset.sceneId || '',
            sceneTitle: assistant.dataset.sceneTitle || '',
            question: localize(question),
            response
        });
    }
}

async function runInterview(assistant, streamBody, role, question) {
    const lang = getLanguage();
    const roleItem = interviewRoles.find((item) => item.id === role);
    const roleLabel = roleItem ? localize(roleItem.label) : role;
    const roleBackground = await getRoleBackground(role);
    const prompts = getAiPrompts();
    const messages = [
        {
            role: 'system',
            content: lang === 'zh'
                ? `${roleLabel}。${prompts.interview.zh}`
                : `${roleLabel}. ${prompts.interview.en}`
        },
        {
            role: 'user',
            content: [
                `${lang === 'zh' ? '角色背景' : 'Role background'}: ${roleBackground || '-'}`,
                `${lang === 'zh' ? '问题' : 'Question'}: ${question}`
            ].join('\n')
        }
    ];
    const streamTitle = assistant.querySelector('.assistant-stream-title');
    if (streamTitle) {
        streamTitle.style.display = 'none';
    }
    const streamStatus = assistant.querySelector('.assistant-stream-status');
    if (streamStatus) streamStatus.innerHTML = '';
    gameState.incrementAiInteractions();
    updateStatsPanel();
    const response = await streamToElement(assistant, streamBody, messages);
    if (response) {
        gameState.addAiLog({
            type: 'interview',
            sceneId: assistant.dataset.sceneId || '',
            sceneTitle: assistant.dataset.sceneTitle || '',
            role: roleLabel,
            question,
            response
        });
    }
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

export function updateStatsPanel() {
    const state = gameState.getState();
    const nameEl = document.getElementById('stats-name');
    const scoreEl = document.getElementById('stats-score');
    const liveScoreEl = document.getElementById('live-score-value');
    const clicksEl = document.getElementById('stats-clicks');
    const distanceEl = document.getElementById('stats-distance');
    const aiEl = document.getElementById('stats-ai');
    const choicesEl = document.getElementById('stats-choices');

    if (nameEl) nameEl.textContent = state.playerName || '-';
    if (clicksEl) clicksEl.textContent = `${state.clickCount || 0}`;
    if (distanceEl) distanceEl.textContent = `${Math.round(state.mouseDistance || 0)} px`;
    if (aiEl) aiEl.textContent = `${state.aiInteractions || 0}`;

    const score = typeof state.newsValue === 'number' ? state.newsValue : 60;
    if (scoreEl) scoreEl.textContent = `${score} / 100`;
    if (liveScoreEl) liveScoreEl.textContent = `${score} / 100`;

    if (choicesEl) {
        choicesEl.innerHTML = '';
        state.decisions.forEach((entry) => {
            const li = document.createElement('li');
            const choiceLabel = entry.choiceIntl ? localize(entry.choiceIntl) : entry.choiceText;
            li.textContent = choiceLabel || '-';
            choicesEl.appendChild(li);
        });
    }
}

export function setStatsVisibility(visible) {
    const panel = document.getElementById('stats-panel');
    if (!panel) return;
    panel.classList.toggle('is-visible', !!visible);
}

function buildStatsPayload() {
    const state = gameState.getState();
    const start = state.sessionStart || Date.now();
    const durationMs = Math.max(0, Date.now() - start);
    return {
        name: state.playerName || '',
        aiEnabled: !!state.aiEnabled,
        clicks: state.clickCount || 0,
        distance: Math.round(state.mouseDistance || 0),
        aiInteractions: state.aiInteractions || 0,
        aiLogs: state.aiLogs || [],
        clickPoints: state.clickPoints || [],
        sceneImage: state.currentSceneImage || '',
        nonAiLogs: state.nonAiLogs || [],
        choices: state.decisions.map((entry) => {
            return {
                sceneId: entry.sceneId,
                text: entry.choiceIntl ? localize(entry.choiceIntl) : entry.choiceText
            };
        }),
        newsValue: typeof state.newsValue === 'number' ? state.newsValue : 60,
        durationMs,
        timestamp: Date.now()
    };
}

function saveStatsToLocal(payload) {
    const key = 'newsgame-stats';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(payload);
    localStorage.setItem(key, JSON.stringify(list));
}

function captureSnapshot() {
    if (typeof window.html2canvas !== 'function') {
        return Promise.resolve('');
    }
    const target = document.documentElement;
    return window.html2canvas(target, {
        useCORS: true,
        backgroundColor: null,
        scale: 1
    }).then((canvas) => {
        return canvas.toDataURL('image/png');
    }).catch(() => '');
}

function finalizeStats() {
    gameState.setTelemetryActive(false);
    updateStatsPanel();
    const basePayload = buildStatsPayload();
    captureSnapshot().then((snapshot) => {
        const payload = {
            ...basePayload,
            pageSnapshot: snapshot
        };
        saveStatsToLocal(payload);
    }).catch(() => {
        saveStatsToLocal(basePayload);
    });
}
