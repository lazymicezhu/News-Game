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
let currentChoiceHandler = null;
let currentSceneId = '';
const mainSceneLeads = {
    intro: {
        type: 'followup',
        question: {
            zh: '这条传闻最可能从哪里扩散？',
            en: 'Where did the rumor most likely spread from?'
        },
        key: 'lead_intro_rumor_source',
        titleKey: 'leadIntroTitle',
        bodyKey: 'leadIntroBody',
        aiLine: {
            zh: '线索：有更早的火光片段出现在 01:40 之前。',
            en: 'Lead: an earlier fireball clip appeared before 1:40 a.m.'
        }
    },
    briefing: {
        type: 'followup',
        question: {
            zh: '撤离通知有没有出现延迟或遗漏？',
            en: 'Were any evacuation notices delayed or missed?'
        },
        key: 'lead_evac_gap',
        titleKey: 'leadEvacTitle',
        bodyKey: 'leadEvacBody',
        aiLine: {
            zh: '线索：一处社区的撤离通知可能延后送达。',
            en: 'Lead: one community’s evacuation notice may have been delayed.'
        }
    },
    route_choice: {
        type: 'followup',
        question: {
            zh: '哪一处场域最可能出现信息断层？',
            en: 'Which site is most likely to have information gaps?'
        },
        key: 'lead_route_priority',
        titleKey: 'leadRouteTitle',
        bodyKey: 'leadRouteBody',
        aiLine: {
            zh: '线索：北侧避难所已超载，南侧仍有余量。',
            en: 'Lead: the north shelter is over capacity while the south has room.'
        }
    },
    shelter: {
        type: 'interview',
        roleId: 'volunteer',
        key: 'lead_shelter_overflow',
        titleKey: 'leadShelterTitle',
        bodyKey: 'leadShelterBody',
        aiLine: {
            zh: '线索：夜里出现床位复用，人员在帐区轮换。',
            en: 'Lead: beds are being reused overnight as people rotate.'
        }
    },
    hospital: {
        type: 'interview',
        roleId: 'reporter',
        key: 'lead_hospital_smoke',
        titleKey: 'leadHospitalTitle',
        bodyKey: 'leadHospitalBody',
        aiLine: {
            zh: '线索：高风险人群被建议转移到清洁空气点。',
            en: 'Lead: high‑risk groups are advised to move to clean‑air points.'
        }
    },
    logistics: {
        type: 'interview',
        roleId: 'volunteer',
        key: 'lead_logistics_delay',
        titleKey: 'leadLogisticsTitle',
        bodyKey: 'leadLogisticsBody',
        aiLine: {
            zh: '线索：车队在关键路口改道，ETA 延后。',
            en: 'Lead: convoys detoured at a key junction and ETA slipped.'
        }
    },
    data_room: {
        type: 'followup',
        question: {
            zh: '数据里哪一处最不一致？',
            en: 'Which data point is most inconsistent?'
        },
        key: 'lead_data_anomaly',
        titleKey: 'leadDataTitle',
        bodyKey: 'leadDataBody',
        aiLine: {
            zh: '线索：控制率口径在两家媒体间不一致。',
            en: 'Lead: containment figures differ between two outlets.'
        }
    },
    rumor_trace: {
        type: 'interview',
        roleId: 'fire',
        key: 'lead_rumor_timestamp',
        titleKey: 'leadRumorTitle',
        bodyKey: 'leadRumorBody',
        aiLine: {
            zh: '线索：视频时间戳疑似被剪切。',
            en: 'Lead: the clip’s timestamp appears trimmed.'
        }
    },
    official_response: {
        type: 'followup',
        question: {
            zh: '官方话术里有哪些保留表述？',
            en: 'Which phrasing suggests official caution?'
        },
        key: 'lead_official_wording',
        titleKey: 'leadOfficialTitle',
        bodyKey: 'leadOfficialBody',
        aiLine: {
            zh: '线索：官方反复使用“疑似”“待确认”。',
            en: 'Lead: officials repeatedly used “suspected” and “pending.”'
        }
    },
    community_hearings: {
        type: 'followup',
        question: {
            zh: '证言里最明显的矛盾点是什么？',
            en: 'What is the most obvious contradiction in testimony?'
        },
        key: 'lead_community_contradict',
        titleKey: 'leadCommunityTitle',
        bodyKey: 'leadCommunityBody',
        aiLine: {
            zh: '线索：地理描述出现相互矛盾。',
            en: 'Lead: location details contradict each other.'
        }
    },
    verification: {
        type: 'followup',
        question: {
            zh: '还缺少哪一条独立来源？',
            en: 'Which independent source is still missing?'
        },
        key: 'lead_verification_gap',
        titleKey: 'leadVerifyTitle',
        bodyKey: 'leadVerifyBody',
        aiLine: {
            zh: '线索：还缺一条独立来源交叉印证。',
            en: 'Lead: one independent source is still missing.'
        }
    },
    drafting: {
        type: 'followup',
        question: {
            zh: '读者最在意哪个信息？',
            en: 'What do readers care about most?'
        },
        key: 'lead_drafting_angle',
        titleKey: 'leadDraftTitle',
        bodyKey: 'leadDraftBody',
        aiLine: {
            zh: '线索：撤离路线与空气风险最受关注。',
            en: 'Lead: evacuation routes and air risk draw the most attention.'
        }
    },
    final_decision: {
        type: 'followup',
        question: {
            zh: '下一轮更新最关键是什么？',
            en: 'What is the key point for the next update?'
        },
        key: 'lead_final_update',
        titleKey: 'leadFinalTitle',
        bodyKey: 'leadFinalBody',
        aiLine: {
            zh: '线索：传闻溯源结果将决定下一轮更新。',
            en: 'Lead: the rumor source trace will drive the next update.'
        }
    }
};



const tutorialRoles = [
    { id: 'officer', label: { zh: '值班民警 周隽', en: 'Duty officer Zhou Jun' } },
    { id: 'witness', label: { zh: '目击者 陈岚', en: 'Witness Chen Lan' } },
    { id: 'shop', label: { zh: '便利店老板 许皓', en: 'Shop owner Xu Hao' } }
];

const tutorialRoleBackgrounds = {
    officer: {
        zh: '你是值班民警周隽，已到达现场并保持克制表述。你知道初步情况与警方简短通报，但不会推断动机，只强调等待确认。',
        en: 'You are duty officer Zhou Jun on scene. You know the preliminary situation and the brief police note, but you avoid speculation and stress confirmation.'
    },
    witness: {
        zh: '你是目击者陈岚，听到争吵与脚步声，但看不清倒地原因。你的描述带有情绪，信息可能不完整。',
        en: 'You are witness Chen Lan. You heard an argument and footsteps but did not see the cause. Your account is emotional and incomplete.'
    },
    shop: {
        zh: '你是便利店老板许皓，看到地面有红色液体，怀疑是油漆桶倒翻。你更关注现场秩序与客人安全。',
        en: 'You are shop owner Xu Hao. You saw red liquid on the ground and suspect a toppled paint bucket. You focus on safety and order.'
    }
};

const tutorialBackground = {
    zh: '清晨 06:10，社区小巷里有人倒在地上，社媒传“奇怪的谋杀”。警方尚未确认，目击者听到争吵，便利店老板提到红色液体，物业监控仍在导出。请先区分事实与传闻。',
    en: 'At 6:10 a.m., someone collapsed in a community alley. Social media calls it a “strange murder,” but police have not confirmed. A witness heard an argument, a shop owner saw red liquid, and CCTV is still exporting. Separate facts from rumors.'
};

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
        image.loading = 'lazy';
        image.decoding = 'async';
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

    // 多媒体
    if (Array.isArray(scene.media) && scene.media.length) {
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'scene-media';
        scene.media.forEach((item) => {
            if (!item) return;
            if (item.type === 'image' && item.src) {
                const mediaImg = document.createElement('img');
                mediaImg.src = item.src;
                mediaImg.alt = item.alt ? localize(item.alt) : 'media';
                mediaImg.className = 'scene-media-image';
                mediaImg.loading = 'lazy';
                mediaImg.decoding = 'async';
                mediaWrap.appendChild(mediaImg);
                return;
            }
            if (item.type === 'video' && item.src) {
                const video = document.createElement('video');
                video.className = 'scene-media-video';
                video.controls = true;
                video.src = item.src;
                if (item.poster) {
                    video.poster = item.poster;
                }
                mediaWrap.appendChild(video);
                return;
            }
            const placeholder = document.createElement('div');
            placeholder.className = 'scene-media-placeholder';
            placeholder.textContent = item.label ? localize(item.label) : t('assistantSearching');
            mediaWrap.appendChild(placeholder);
        });
        sceneDiv.appendChild(mediaWrap);
    }

    // 阶段性评估
    if (scene.evaluation) {
        const evalBox = document.createElement('div');
        evalBox.className = 'scene-evaluation';
        const evalTitle = document.createElement('div');
        evalTitle.className = 'scene-evaluation-title';
        evalTitle.textContent = t('stageEvaluation');
        const evalBody = document.createElement('div');
        evalBody.className = 'scene-evaluation-body';
        evalBody.textContent = localize(scene.evaluation);
        evalBox.appendChild(evalTitle);
        evalBox.appendChild(evalBody);
        sceneDiv.appendChild(evalBox);
    }
    
    // 选项
    if (scene.choices && scene.choices.length > 0) {
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices';

        const allChoices = [...scene.choices];
        if (scene.id && scene.id.startsWith('tutorial_') && scene.id !== 'tutorial_resolution' && scene.id !== 'tutorial_ending' && gameState.hasEvidence('paint_bucket')) {
            allChoices.unshift(getEvidenceChoice());
        }

        allChoices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.textContent = localize(choice.text);
            if (choice.hint) {
                button.title = localize(choice.hint);
            }
            if (isEvidenceChoice(choice)) {
                button.classList.add('evidence-choice');
                button.dataset.evidenceChoice = 'true';
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

    currentChoiceHandler = onChoice;
    currentSceneId = scene?.id || '';

    // 替换内容
    appElement.innerHTML = '';
    appElement.appendChild(sceneDiv);

    // 助手浮层
    renderAssistant(scene, !(scene.choices && scene.choices.length === 0));
    showAiMaskIfNeeded(scene);
    showShopHintMaskIfNeeded(scene);
    insertEvidenceChoiceImmediate();
    const lastDelta = gameState.consumeLastChoiceDelta();
    if (typeof lastDelta === 'number') {
        showChoiceFeedback(lastDelta);
    }
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
                <img src="arts/ai-assistant.svg" alt="assistant">
            </div>
            <div class="assistant-bubble">
                <div class="assistant-text">${t('assistantFallback')}</div>
                <div class="assistant-note">${t('assistantNote')}</div>
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
    const noteEl = assistant.querySelector('.assistant-note');

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
    const roleList = scene && scene.id && scene.id.startsWith('tutorial_') ? tutorialRoles : interviewRoles;
    renderInterviewRoles(roleSelect, roleList);
    inputEl.placeholder = t('assistantQuestionPlaceholder');
    sendBtn.textContent = t('assistantSend');
    if (noteEl) noteEl.textContent = t('assistantNote');
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
            dismissShopHintMask();
            if (streamTitle) {
                streamTitle.textContent = t('assistantResponseTitle');
                streamTitle.style.display = 'block';
            }
        });

        interviewBtn.addEventListener('click', () => {
            panel.classList.toggle('open');
            if (controls) controls.style.display = 'none';
            dismissShopHintMask();
            if (streamTitle) {
                streamTitle.style.display = 'none';
            }
        });

        sendBtn.addEventListener('click', async () => {
            const question = inputEl.value.trim();
            if (!question) return;
            panel.classList.add('open');
            inputEl.value = '';
            dismissShopHintMask();
            await runInterview(assistant, streamBody, roleSelect.value, question);
        });
    }
}

function showAiMaskIfNeeded(scene) {
    if (!scene || scene.id !== 'tutorial_intro') return;
    const state = gameState.getState();
    if (!state.aiEnabled && !state.aiConfigured) return;
    const key = 'newsgame-ai-mask-seen';
    if (localStorage.getItem(key)) return;
    if (document.getElementById('ai-mask')) return;

    const mask = document.createElement('div');
    mask.id = 'ai-mask';
    mask.innerHTML = `
        <div class="ai-mask-backdrop"></div>
        <div class="ai-mask-card">
            <div class="ai-mask-title">${t('aiMaskTitle')}</div>
            <div class="ai-mask-body">${t('aiMaskBody')}</div>
            <button class="btn btn-primary ai-mask-close">${t('aiMaskButton')}</button>
        </div>
        <div class="ai-mask-arrow"></div>
    `;
    document.body.appendChild(mask);

    const card = mask.querySelector('.ai-mask-card');
    const arrow = mask.querySelector('.ai-mask-arrow');

    const positionMask = () => {
        const assistantBubble = document.querySelector('#assistant .assistant-bubble');
        if (!assistantBubble) return false;
        const rect = assistantBubble.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, rect.height) * 0.7 + 16;
        mask.style.setProperty('--spot-x', `${centerX}px`);
        mask.style.setProperty('--spot-y', `${centerY}px`);
        mask.style.setProperty('--spot-r', `${radius}px`);

        const cardWidth = Math.min(360, window.innerWidth * 0.86);
        const cardHeight = card.getBoundingClientRect().height || 160;
        const gap = 48;
        const left = Math.max(16, centerX - cardWidth - gap);
        const top = Math.min(Math.max(16, centerY - cardHeight - gap), window.innerHeight - cardHeight - 16);
        card.style.left = `${left}px`;
        card.style.top = `${top}px`;

        const sx = left + cardWidth;
        const sy = top + cardHeight / 2;
        const dx = centerX - sx;
        const dy = centerY - sy;
        const length = Math.max(60, Math.hypot(dx, dy) - 10);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        arrow.style.left = `${sx}px`;
        arrow.style.top = `${sy}px`;
        arrow.style.setProperty('--arrow-length', `${length}px`);
        arrow.style.setProperty('--arrow-angle', `${angle}deg`);
        return true;
    };

    const tryPosition = () => {
        if (!positionMask()) {
            requestAnimationFrame(tryPosition);
        }
    };

    requestAnimationFrame(tryPosition);
    window.addEventListener('resize', positionMask);

    const closeBtn = mask.querySelector('.ai-mask-close');
    closeBtn.addEventListener('click', () => {
        localStorage.setItem(key, '1');
        window.removeEventListener('resize', positionMask);
        mask.remove();
    });
}

function dismissShopHintMask() {
    const mask = document.getElementById('tutorial-hint-mask');
    if (!mask) return;
    localStorage.setItem('newsgame-tutorial-shop-hint-seen', '1');
    mask.remove();
}

function showShopHintMaskIfNeeded(scene) {
    if (!scene || scene.id !== 'tutorial_follow') return;
    const state = gameState.getState();
    if (!state.aiEnabled && !state.aiConfigured) return;
    const key = 'newsgame-tutorial-shop-hint-seen';
    if (localStorage.getItem(key)) return;
    if (document.getElementById('tutorial-hint-mask')) return;

    const mask = document.createElement('div');
    mask.id = 'tutorial-hint-mask';
    mask.innerHTML = `
        <div class="ai-mask-backdrop"></div>
        <div class="ai-mask-card">
            <div class="ai-mask-title">${t('shopHintTitle')}</div>
            <div class="ai-mask-body">${t('shopHintBody')}</div>
            <button class="btn btn-primary ai-mask-close">${t('shopHintButton')}</button>
        </div>
        <div class="ai-mask-arrow"></div>
    `;
    document.body.appendChild(mask);

    const card = mask.querySelector('.ai-mask-card');
    const arrow = mask.querySelector('.ai-mask-arrow');

    const positionMask = () => {
        const assistantBubble = document.querySelector('#assistant .assistant-bubble');
        if (!assistantBubble) return false;
        const rect = assistantBubble.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, rect.height) * 0.7 + 16;
        mask.style.setProperty('--spot-x', `${centerX}px`);
        mask.style.setProperty('--spot-y', `${centerY}px`);
        mask.style.setProperty('--spot-r', `${radius}px`);

        const cardWidth = Math.min(360, window.innerWidth * 0.86);
        const cardHeight = card.getBoundingClientRect().height || 160;
        const left = Math.max(16, centerX - cardWidth - 48);
        const top = Math.min(Math.max(16, centerY - cardHeight - 48), window.innerHeight - cardHeight - 16);
        card.style.left = `${left}px`;
        card.style.top = `${top}px`;

        const sx = left + cardWidth;
        const sy = top + cardHeight / 2;
        const dx = centerX - sx;
        const dy = centerY - sy;
        const length = Math.max(60, Math.hypot(dx, dy) - 10);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        arrow.style.left = `${sx}px`;
        arrow.style.top = `${sy}px`;
        arrow.style.setProperty('--arrow-length', `${length}px`);
        arrow.style.setProperty('--arrow-angle', `${angle}deg`);
        return true;
    };

    const tryPosition = () => {
        if (!positionMask()) {
            requestAnimationFrame(tryPosition);
        }
    };

    requestAnimationFrame(tryPosition);
    window.addEventListener('resize', positionMask);

    const closeBtn = mask.querySelector('.ai-mask-close');
    closeBtn.addEventListener('click', () => {
        localStorage.setItem(key, '1');
        window.removeEventListener('resize', positionMask);
        mask.remove();
    });
}

export function showChoiceFeedback(delta) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    const toast = document.createElement('div');
    toast.className = 'choice-feedback';
    if (delta >= 2) {
        toast.classList.add('positive');
        toast.textContent = t('choiceFeedbackPositive');
    } else if (delta <= -1) {
        toast.classList.add('risk');
        toast.textContent = t('choiceFeedbackRisk');
    } else {
        toast.classList.add('neutral');
        toast.textContent = t('choiceFeedbackNeutral');
    }
    appElement.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 2000);
}

function showEvidenceModal(title, body) {
    if (document.getElementById('evidence-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'evidence-modal';
    modal.innerHTML = `
        <div class="evidence-backdrop"></div>
        <div class="evidence-card">
            <div class="evidence-title">${title || t('evidenceTitle')}</div>
            <div class="evidence-body">${body || t('evidenceBody')}</div>
            <button class="btn btn-primary evidence-close">${t('evidenceConfirm')}</button>
        </div>
    `;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector('.evidence-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
}


function getSceneLead(sceneId) {
    if (!sceneId) return null;
    return mainSceneLeads[sceneId] || null;
}

function pickLeadLine(lead, lang) {
    if (!lead || !lead.aiLine) return '';
    return lang === 'zh' ? lead.aiLine.zh : lead.aiLine.en;
}

function matchesLeadQuestion(lead, question, lang) {
    if (!lead || lead.type !== 'followup') return false;
    if (!question) return false;
    const leadText = lang === 'zh' ? lead.question?.zh : lead.question?.en;
    return leadText && question.trim() === leadText.trim();
}

function maybeGrantSceneLead(sceneId, lead, lang) {
    if (!lead) return false;
    const gained = gameState.addEvidence(lead.key);
    if (!gained) return false;
    gameState.applyEffect({ newsValueDelta: 3 });
    updateStatsPanel();
    showEvidenceModal(t(lead.titleKey), t(lead.bodyKey));
    return true;
}
function getEvidenceChoice() {
    return {
        text: { zh: '立即结案：发布澄清', en: 'Close the case now: publish the clarification' },
        next: 'tutorial_ending',
        effect: { newsValueDelta: 2 }
    };
}

function isEvidenceChoice(choice) {
    return choice?.next === 'tutorial_ending';
}




    updateStatsPanel();
    showEvidenceModal(t(lead.titleKey), t(lead.bodyKey));
}


    updateStatsPanel();
    showEvidenceModal(t(lead.titleKey), t(lead.bodyKey));
}
function insertEvidenceChoiceImmediate() {
    if (!currentSceneId || !currentSceneId.startsWith('tutorial_')) return;
    if (currentSceneId === 'tutorial_resolution' || currentSceneId === 'tutorial_ending') return;
    if (!gameState.hasEvidence('paint_bucket')) return;
    if (typeof currentChoiceHandler !== 'function') return;
    const choicesDiv = document.querySelector('#app .choices');
    if (!choicesDiv) return;
    if (choicesDiv.querySelector('[data-evidence-choice="true"]')) return;

    const choice = getEvidenceChoice();
    const button = document.createElement('button');
    button.className = 'btn btn-primary evidence-choice';
    button.dataset.evidenceChoice = 'true';
    button.textContent = localize(choice.text);
    button.onclick = () => currentChoiceHandler(choice, 0);
    choicesDiv.prepend(button);
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

function formatAiResponse(raw) {
    if (!raw) return '';
    const escapeHtml = (value) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const pattern = /（[^）]+）|\([^)\n]+\)/g;
    let lastIndex = 0;
    let result = '';
    let match;
    while ((match = pattern.exec(raw)) !== null) {
        const start = match.index;
        const end = pattern.lastIndex;
        const before = raw.slice(lastIndex, start);
        const content = match[0].slice(1, -1).trim();
        result += escapeHtml(before);
        if (content) {
            result += `<span class="assistant-annotation">${escapeHtml(content)}</span>`;
        }
        lastIndex = end;
    }
    result += escapeHtml(raw.slice(lastIndex));
    return result;
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
        streamBody.innerHTML = formatAiResponse(fullText);
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

function renderInterviewRoles(selectEl, roles = interviewRoles) {
    if (!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = '';
    roles.forEach((role) => {
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
    const sceneId = assistant.dataset.sceneId || '';
    const background = sceneId.startsWith('tutorial_')
        ? (lang === 'zh' ? tutorialBackground.zh : tutorialBackground.en)
        : await getAiBackground();
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
        const lead = getSceneLead(sceneId);
        if (matchesLeadQuestion(lead, localize(question), lang)) {
            const gained = maybeGrantSceneLead(sceneId, lead, lang);
            if (gained) {
                const line = pickLeadLine(lead, lang);
                if (line) {
                    const updated = `${response}
（${line}）`;
                    streamBody.innerHTML = formatAiResponse(updated);
                }
            }
        }
    }
}

async function runInterview(assistant, streamBody, role, question) {
    const lang = getLanguage();
    const sceneId = assistant.dataset.sceneId || '';
    const roleList = sceneId.startsWith('tutorial_') ? tutorialRoles : interviewRoles;
    const roleItem = roleList.find((item) => item.id === role);
    const roleLabel = roleItem ? localize(roleItem.label) : role;
    const roleBackground = sceneId.startsWith('tutorial_')
        ? (tutorialRoleBackgrounds[role]?.[lang] || '-')
        : await getRoleBackground(role);
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
        const sceneId = assistant.dataset.sceneId || '';
        if (sceneId.startsWith('tutorial_') && role === 'shop') {
            const gained = gameState.addEvidence('paint_bucket');
            if (gained) {
                gameState.applyEffect({ newsValueDelta: 5 });
                updateStatsPanel();
                showEvidenceModal(t('evidenceTitle'), t('evidenceBody'));
                insertEvidenceChoiceImmediate();
            }
        }
        if (!sceneId.startsWith('tutorial_')) {
            const lead = getSceneLead(sceneId);
            if (lead && lead.type === 'interview' && lead.roleId === role) {
                const gained = maybeGrantSceneLead(sceneId, lead, lang);
                if (gained) {
                    const line = pickLeadLine(lead, lang);
                    if (line) {
                        const updated = `${response}
（${line}）`;
                        streamBody.innerHTML = formatAiResponse(updated);
                    }
                }
            }
        }
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
        wildfireFamiliarity: state.wildfireFamiliarity || '',
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
