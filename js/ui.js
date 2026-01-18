import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';
import { t, localize, getLanguage } from './i18n.js';
import { streamChat } from './aiClient.js';
import { followupQuestions } from '../data/followupQuestions.js';

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
                    <select class="assistant-role">
                        <option value="fire">${t('roleFire')}</option>
                        <option value="resident">${t('roleResident')}</option>
                        <option value="volunteer">${t('roleVolunteer')}</option>
                        <option value="reporter">${t('roleReporter')}</option>
                    </select>
                    <textarea class="assistant-input" rows="2" placeholder="${t('assistantQuestionPlaceholder')}"></textarea>
                    <button class="btn btn-primary assistant-send">${t('assistantSend')}</button>
                </div>
                <div class="assistant-stream">
                    <div class="assistant-stream-title">${t('assistantResponseTitle')}</div>
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
    const controls = assistant.querySelector('.assistant-controls');

    // 始终显示助手：每个场景刷新一句
    assistant.style.display = 'flex';
    const pool = assistantLines[getLanguage()] || [];
    const line = gameState.nextAssistantLine(pool) || t('assistantFallback');
    textEl.textContent = line;
    streamTitle.textContent = t('assistantResponseTitle');
    streamTitle.style.display = 'block';
    followupBtn.textContent = t('assistantFollowup');
    interviewBtn.textContent = t('assistantInterview');
    panel.querySelector('.assistant-label').textContent = t('assistantRoleLabel');
    const roleOptions = roleSelect.querySelectorAll('option');
    if (roleOptions[0]) roleOptions[0].textContent = t('roleFire');
    if (roleOptions[1]) roleOptions[1].textContent = t('roleResident');
    if (roleOptions[2]) roleOptions[2].textContent = t('roleVolunteer');
    if (roleOptions[3]) roleOptions[3].textContent = t('roleReporter');
    inputEl.placeholder = t('assistantQuestionPlaceholder');
    sendBtn.textContent = t('assistantSend');
    if (controls) {
        controls.style.display = showActions ? 'flex' : 'none';
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

function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function showFollowupStages(assistant, streamBody, requestId) {
    const stages = [t('assistantGenerating'), t('assistantSearching'), t('assistantReasoning')];
    for (const stage of stages) {
        if (assistant.dataset.requestId !== requestId) return;
        resetStream(streamBody, stage);
        await pause(450);
    }
}

async function runFollowupAnswer(assistant, followupList, question) {
    const { title, text } = buildSceneContext(assistant);
    const lang = getLanguage();
    const messages = [
        {
            role: 'system',
            content: lang === 'zh'
                ? '你是新闻编辑助理。基于场景内容回答追问，回答简洁、具体。'
                : 'You are a newsroom assistant. Answer the follow-up question based on the scene, concise and specific.'
        },
        {
            role: 'user',
            content: [
                `Scene: ${title || '-'}`,
                `Context: ${text || '-'}`,
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
    gameState.incrementAiInteractions();
    updateStatsPanel();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    assistant.dataset.requestId = requestId;
    await showFollowupStages(assistant, streamBody, requestId);
    if (assistant.dataset.requestId !== requestId) return;
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
    const { title, text } = buildSceneContext(assistant);
    const lang = getLanguage();
    const roleMap = {
        fire: t('roleFire'),
        resident: t('roleResident'),
        volunteer: t('roleVolunteer'),
        reporter: t('roleReporter')
    };
    const roleLabel = roleMap[role] || role;
    const messages = [
        {
            role: 'system',
            content: lang === 'zh'
                ? `你是${roleLabel}，正在接受记者采访。请基于场景背景作答，回答保持简短自然。`
                : `You are a ${roleLabel} being interviewed. Answer based on the scene context in a concise, natural tone.`
        },
        {
            role: 'user',
            content: [
                `Scene: ${title || '-'}`,
                `Context: ${text || '-'}`,
                `${lang === 'zh' ? '问题' : 'Question'}: ${question}`
            ].join('\n')
        }
    ];
    const streamTitle = assistant.querySelector('.assistant-stream-title');
    if (streamTitle) {
        streamTitle.style.display = 'none';
    }
    gameState.incrementAiInteractions();
    updateStatsPanel();
    const response = await streamToElement(assistant, streamBody, messages);
    if (response) {
        gameState.addAiLog({
            type: 'interview',
            sceneId: assistant.dataset.sceneId || '',
            sceneTitle: assistant.dataset.sceneTitle || '',
            role,
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
    const clicksEl = document.getElementById('stats-clicks');
    const distanceEl = document.getElementById('stats-distance');
    const aiEl = document.getElementById('stats-ai');
    const choicesEl = document.getElementById('stats-choices');

    if (nameEl) nameEl.textContent = state.playerName || '-';
    if (clicksEl) clicksEl.textContent = `${state.clickCount || 0}`;
    if (distanceEl) distanceEl.textContent = `${Math.round(state.mouseDistance || 0)} px`;
    if (aiEl) aiEl.textContent = `${state.aiInteractions || 0}`;

    const decisionCount = state.decisions.length;
    const score = Math.min(
        100,
        decisionCount * 12
            + Math.floor((state.aiInteractions || 0) * 8)
            + Math.floor((state.clickCount || 0) / 10)
            + Math.floor((state.mouseDistance || 0) / 800)
    );
    if (scoreEl) scoreEl.textContent = `${score} / 100`;

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
        choices: state.decisions.map((entry) => {
            return {
                sceneId: entry.sceneId,
                text: entry.choiceIntl ? localize(entry.choiceIntl) : entry.choiceText
            };
        }),
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

function finalizeStats() {
    gameState.setTelemetryActive(false);
    updateStatsPanel();
    const payload = buildStatsPayload();
    saveStatsToLocal(payload);
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
