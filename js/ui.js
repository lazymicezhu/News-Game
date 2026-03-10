import { gameState } from './state.js';
import { assistantLines } from '../data/assistantLines.js';
import { t, localize, getLanguage } from './i18n.js';
import { streamChat } from './aiClient.js';
import { getAiBackground, getRoleBackground, getAiPrompts } from './aiContext.js';
import { followupQuestions as defaultFollowupQuestions } from '../data/followupQuestions.js';
import { nonAiHints } from '../data/nonAiHints.js';
import { interviewRoles as defaultInterviewRoles } from '../data/interviewRoles.js';

const REMOTE_STATS_ENDPOINT = 'https://newsgame-egxdvooreq.cn-hangzhou.fcapp.run/responses';

let followupQuestions = defaultFollowupQuestions;
let interviewRoles = defaultInterviewRoles;
let currentChoiceHandler = null;
let currentSceneId = '';
let aiAvatarIntroPlayed = false;
let aiAvatarIntroRunning = false;
let statsFinalized = false;
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

const aiLeadHintSceneIds = new Set([
    'intro',
    'briefing',
    'route_choice',
    'shelter',
    'hospital',
    'logistics',
    'rumor_trace',
    'official_response',
    'verification',
    'final_decision'
]);

function getAiLeadHint(sceneId, lang) {
    if (!sceneId || !aiLeadHintSceneIds.has(sceneId)) return '';
    const lead = mainSceneLeads[sceneId];
    if (!lead) return '';
    if (gameState.hasEvidence(lead.key)) return '';
    if (lead.type === 'followup') {
        const subtleFollowupHints = {
            intro: {
                zh: '也许可以先摸一摸这条传闻是从哪条链路扩开的。',
                en: 'You might start by tracing which path amplified this rumor.'
            },
            briefing: {
                zh: '简报之外，撤离通知的时间差可能藏着关键信息。',
                en: 'Outside the briefing, timing gaps in evacuation notices may matter.'
            },
            route_choice: {
                zh: '先找信息最容易断层的点位，常能更快抓住主线。',
                en: 'Finding the weakest information link often reveals the main thread.'
            },
            data_room: {
                zh: '把不一致的数据先挑出来，线索通常就在那里。',
                en: 'Conflicting data points are often where the lead is.'
            },
            official_response: {
                zh: '留意那些带保留意味的措辞，可能比结论更有信息量。',
                en: 'Watch cautious wording; it can reveal more than conclusions.'
            },
            community_hearings: {
                zh: '证言里若有对不上的地理细节，值得再往下挖。',
                en: 'If location details conflict in testimony, that thread is worth pulling.'
            },
            verification: {
                zh: '再补一条独立来源，整条证据链会稳很多。',
                en: 'One more independent source could stabilize the whole chain.'
            },
            drafting: {
                zh: '稿件角度可以先贴近读者最急需的信息。',
                en: 'You may want to anchor the draft in what readers need most right now.'
            },
            final_decision: {
                zh: '下一轮更新最关键的变量，最好先写进计划里。',
                en: 'It may help to lock the key variable for the next update first.'
            }
        };
        const pick = subtleFollowupHints[sceneId];
        if (!pick) return '';
        return lang === 'zh'
            ? `提示：${pick.zh}`
            : `Tip: ${pick.en}`;
    }
    if (lead.type === 'interview') {
        const subtleInterviewHints = {
            shelter: {
                zh: '今晚床位和轮换信息，可能在一线协助者那里更清楚。',
                en: 'Tonight’s bed turnover details may be clearer from frontline helpers.'
            },
            hospital: {
                zh: '健康风险的变化，现场跑医疗线的人往往最先感到。',
                en: 'Shifts in health risk are often felt first by people covering medical lines.'
            },
            logistics: {
                zh: '关于改道与到达延迟，执行端视角可能更接近事实。',
                en: 'For detours and ETA slips, operational voices are often closer to ground truth.'
            },
            rumor_trace: {
                zh: '传闻视频的时间问题，熟悉处置流程的人也许能给你参照。',
                en: 'On clip timing, someone close to response procedures may offer a better anchor.'
            }
        };
        const pick = subtleInterviewHints[sceneId];
        if (!pick) return '';
        return lang === 'zh'
            ? `提示：${pick.zh}`
            : `Tip: ${pick.en}`;
    }
    return '';
}



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
    zh: '早晨 07:43，离你很近的街道传出“疑似命案”。现场有人倒地且有红色液体，围观者大量拍摄传播。警方尚未确认定性，目击者说法不一，便利店老板怀疑是油漆倒翻，监控仍在调取。请优先区分可证实事实与情绪化传闻。',
    en: 'At 7:43 a.m., a nearby street reports a “suspected homicide.” A person is down with red liquid on the ground, and bystander footage is spreading fast. Police have not classified the case, witness accounts conflict, a shop owner suspects spilled paint, and CCTV is still being retrieved. Prioritize verifiable facts over emotional rumor.'
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
                const videoWrap = document.createElement('div');
                videoWrap.className = 'scene-media-video-wrap';
                const video = document.createElement('video');
                video.className = 'scene-media-video';
                video.controls = item.controls !== false;
                video.autoplay = !!item.autoplay;
                video.muted = item.muted !== false;
                video.loop = !!item.loop;
                video.playsInline = true;
                video.src = item.src;
                if (item.poster) {
                    video.poster = item.poster;
                }
                videoWrap.appendChild(video);
                const maskBottom = document.createElement('div');
                maskBottom.className = 'scene-media-video-mask';
                videoWrap.appendChild(maskBottom);
                mediaWrap.appendChild(videoWrap);
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

        const choiceOrder = gameState.getSceneChoiceOrder(scene.id, scene.choices.length);
        const orderedChoices = choiceOrder.length === scene.choices.length
            ? choiceOrder.map((index) => scene.choices[index]).filter(Boolean)
            : [...scene.choices];
        const allChoices = [...orderedChoices];
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
        sceneDiv.appendChild(renderEndingReview(score));
        const shouldShowSurveyBtn = gameState.isTelemetryActive();
        if (shouldShowSurveyBtn) {
            const surveyBtn = document.createElement('button');
            surveyBtn.className = 'btn btn-primary';
            surveyBtn.textContent = '进入后测问卷';
            surveyBtn.style.marginTop = '12px';
            surveyBtn.onclick = () => {
                finalizeStats();
            };
            sceneDiv.appendChild(surveyBtn);
        }
        showFooter();
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

function renderEndingReview(score) {
    const state = gameState.getState();
    const panel = document.createElement('section');
    panel.className = 'ending-review';

    const title = document.createElement('div');
    title.className = 'ending-review-title';
    title.textContent = t('endingReviewTitle');
    panel.appendChild(title);

    const statsGrid = document.createElement('div');
    statsGrid.className = 'ending-review-grid';
    const durationSec = Math.max(0, Math.round((Date.now() - (state.sessionStart || Date.now())) / 1000));
    const positiveCount = state.decisions.filter((entry) => (entry.effect?.newsValueDelta || 0) >= 2).length;
    const riskCount = state.decisions.filter((entry) => (entry.effect?.newsValueDelta || 0) <= -1).length;
    let reliability = t('endingReliabilityMedium');
    if (score >= 86 && riskCount <= 2) reliability = t('endingReliabilityHigh');
    if (score < 75 || riskCount >= 5) reliability = t('endingReliabilityLow');

    const metrics = [
        { label: t('endingChoices'), value: `${state.decisions.length}` },
        { label: t('endingAiInteractions'), value: `${state.aiInteractions || 0}` },
        { label: t('endingSessionTime'), value: t('endingSeconds', durationSec) },
        { label: t('endingReliability'), value: reliability }
    ];
    metrics.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'ending-review-item';
        const label = document.createElement('div');
        label.className = 'ending-review-label';
        label.textContent = item.label;
        const value = document.createElement('div');
        value.className = 'ending-review-value';
        value.textContent = item.value;
        card.appendChild(label);
        card.appendChild(value);
        statsGrid.appendChild(card);
    });
    panel.appendChild(statsGrid);

    const highlightSection = document.createElement('div');
    highlightSection.className = 'ending-review-section';
    const highlightTitle = document.createElement('div');
    highlightTitle.className = 'ending-review-subtitle';
    highlightTitle.textContent = t('endingHighlights');
    const highlightList = document.createElement('ol');
    highlightList.className = 'ending-review-list';
    const topPositive = state.decisions
        .filter((entry) => (entry.effect?.newsValueDelta || 0) >= 1)
        .sort((a, b) => (b.effect?.newsValueDelta || 0) - (a.effect?.newsValueDelta || 0))
        .slice(0, 3);
    topPositive.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = entry.choiceIntl ? localize(entry.choiceIntl) : (entry.choiceText || '-');
        highlightList.appendChild(li);
    });
    if (!topPositive.length) {
        const li = document.createElement('li');
        li.textContent = getLanguage() === 'zh' ? '你坚持完成了全流程，并保留了可复盘记录。' : 'You completed the full reporting loop and preserved decisions for review.';
        highlightList.appendChild(li);
    }
    highlightSection.appendChild(highlightTitle);
    highlightSection.appendChild(highlightList);
    panel.appendChild(highlightSection);

    const improveSection = document.createElement('div');
    improveSection.className = 'ending-review-section';
    const improveTitle = document.createElement('div');
    improveTitle.className = 'ending-review-subtitle';
    improveTitle.textContent = t('endingImprove');
    const improveList = document.createElement('ol');
    improveList.className = 'ending-review-list';
    const riskChoices = state.decisions
        .filter((entry) => (entry.effect?.newsValueDelta || 0) <= -1)
        .slice(-3);
    riskChoices.forEach((entry) => {
        const li = document.createElement('li');
        const choiceText = entry.choiceIntl ? localize(entry.choiceIntl) : (entry.choiceText || '-');
        if (getLanguage() === 'zh') {
            li.textContent = `把“${choiceText}”改成先标注证据边界，再决定是否发布。`;
        } else {
            li.textContent = `For "${choiceText}", add evidence boundaries first, then decide publish timing.`;
        }
        improveList.appendChild(li);
    });
    if (!riskChoices.length) {
        const li = document.createElement('li');
        li.textContent = getLanguage() === 'zh' ? '下一局可增加 AI 追问次数，优先补齐“待核实”空缺。' : 'Next run, increase AI follow-ups to close remaining “pending verification” gaps.';
        improveList.appendChild(li);
    }
    if (score < 85) {
        const li = document.createElement('li');
        li.textContent = getLanguage() === 'zh' ? '冲刺信任结局时，优先选择 +3 且可追溯来源的分支。' : 'To reach the trusted ending, prioritize +3 branches with traceable sources.';
        improveList.appendChild(li);
    }
    improveSection.appendChild(improveTitle);
    improveSection.appendChild(improveList);
    panel.appendChild(improveSection);

    return panel;
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
    if (aiEnabled && scene && !isEnding) {
        const hint = getAiLeadHint(scene.id, getLanguage());
        if (hint) {
            line = hint;
        }
    } else if (!aiEnabled && scene && !isEnding) {
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
    if (noteEl) {
        noteEl.style.display = aiEnabled ? 'block' : 'none';
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

    const shouldRunIntroAvatar =
        !!scene &&
        scene.id === 'tutorial_intro' &&
        aiEnabled &&
        !aiAvatarIntroPlayed &&
        !localStorage.getItem('newsgame-ai-mask-seen');
    if (shouldRunIntroAvatar) {
        aiAvatarIntroPlayed = true;
        playAssistantAvatarIntro(assistant, scene);
    }

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

async function playAssistantAvatarIntro(assistant, scene) {
    if (!assistant || aiAvatarIntroRunning) return;
    const avatar = assistant.querySelector('.assistant-avatar');
    if (!avatar) return;

    const img = avatar.querySelector('img');
    const src = img?.getAttribute('src') || 'arts/ai-assistant.svg';
    const target = avatar.getBoundingClientRect();
    if (!target.width || !target.height) return;

    aiAvatarIntroRunning = true;
    assistant.style.visibility = 'hidden';

    const ghost = document.createElement('div');
    ghost.id = 'assistant-intro-avatar';
    ghost.style.position = 'fixed';
    ghost.style.left = '50%';
    ghost.style.top = '50%';
    ghost.style.width = '168px';
    ghost.style.height = '168px';
    ghost.style.borderRadius = '50%';
    ghost.style.overflow = 'hidden';
    ghost.style.border = '3px solid #dbeafe';
    ghost.style.boxShadow = '0 18px 40px rgba(15, 23, 42, 0.22)';
    ghost.style.background = '#fff';
    ghost.style.transform = 'translate(-50%, -50%)';
    ghost.style.zIndex = '720';
    ghost.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);">`;
    document.body.appendChild(ghost);
    const introLine = document.createElement('div');
    introLine.id = 'assistant-intro-line';
    introLine.textContent = t('preludeLineAi');
    introLine.style.position = 'fixed';
    introLine.style.left = '50%';
    introLine.style.top = 'calc(50% + 118px)';
    introLine.style.transform = 'translateX(-50%)';
    introLine.style.maxWidth = 'min(620px, 90vw)';
    introLine.style.padding = '0 16px';
    introLine.style.textAlign = 'center';
    introLine.style.fontSize = '18px';
    introLine.style.lineHeight = '1.6';
    introLine.style.color = '#0b0b0b';
    introLine.style.zIndex = '721';
    introLine.style.opacity = '1';
    introLine.style.transition = 'opacity 0.28s ease';
    document.body.appendChild(introLine);
    await sleep(900);

    const destinationX = target.left + target.width / 2;
    const destinationY = target.top + target.height / 2;
    const scale = target.width / 168;
    const deltaX = destinationX - window.innerWidth / 2;
    const deltaY = destinationY - window.innerHeight / 2;

    await ghost.animate(
        [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.98 },
            { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${scale})`, opacity: 1 }
        ],
        {
            duration: 760,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards'
        }
    ).finished.catch(() => null);

    await sleep(120);
    introLine.style.opacity = '0';
    await sleep(280);
    introLine.remove();
    ghost.remove();
    assistant.style.visibility = 'visible';
    aiAvatarIntroRunning = false;
    showAiMaskIfNeeded(scene);
}

function showAiMaskIfNeeded(scene) {
    if (!scene || scene.id !== 'tutorial_intro') return;
    const state = gameState.getState();
    if (!state.aiEnabled) return;
    if (aiAvatarIntroRunning) return;
    if (!aiAvatarIntroPlayed) return;
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

    attachMaskCloseHandlers(mask, positionMask, () => {
        localStorage.setItem(key, '1');
    });
}

function dismissShopHintMask() {
    const mask = document.getElementById('tutorial-hint-mask');
    if (!mask) return;
    localStorage.setItem('newsgame-tutorial-shop-hint-seen', '1');
    mask.remove();
}

function showShopHintMaskIfNeeded(scene) {
    if (!scene || !scene.id || !scene.id.startsWith('tutorial_follow')) return;
    const state = gameState.getState();
    if (!state.aiEnabled) return;
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

    attachMaskCloseHandlers(mask, positionMask, () => {
        localStorage.setItem(key, '1');
    });
}

function attachMaskCloseHandlers(mask, positionMask, onClose) {
    if (!mask) return;
    const closeBtn = mask.querySelector('.ai-mask-close');
    let closed = false;

    const cleanup = () => {
        if (closed) return;
        closed = true;
        window.removeEventListener('resize', positionMask);
        window.removeEventListener('keydown', onKeyDown);
        mask.remove();
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            cleanup();
        }
    };

    closeBtn?.addEventListener('click', cleanup);
    window.addEventListener('keydown', onKeyDown);
}

export function showChoiceFeedback(delta) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    const toast = document.createElement('div');
    toast.className = 'choice-feedback';
    const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
    const scoreLabel = getLanguage() === 'zh' ? '新闻价值' : 'Story value';
    if (delta >= 2) {
        toast.classList.add('positive');
        toast.textContent = `${scoreLabel} ${deltaText}`;
    } else if (delta <= -1) {
        toast.classList.add('risk');
        toast.textContent = `${scoreLabel} ${deltaText}`;
    } else {
        toast.classList.add('neutral');
        toast.textContent = `${scoreLabel} ${deltaText}`;
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

function normalizeQuestionText(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\u4e00-\u9fffa-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildTokenSet(text) {
    const set = new Set();
    if (!text) return set;
    const parts = text.split(' ');
    for (const part of parts) {
        if (part) set.add(part);
    }
    return set;
}

function countSetOverlap(a, b) {
    if (!a.size || !b.size) return 0;
    let hit = 0;
    for (const item of a) {
        if (b.has(item)) hit += 1;
    }
    return hit;
}

function buildHanCharSet(text) {
    const set = new Set();
    if (!text) return set;
    for (const ch of text) {
        if (/[\u4e00-\u9fff]/.test(ch)) set.add(ch);
    }
    return set;
}

function matchesLeadQuestion(lead, question, lang) {
    if (!lead || lead.type !== 'followup') return false;
    if (!question) return false;
    const leadText = lang === 'zh' ? lead.question?.zh : lead.question?.en;
    if (!leadText) return false;

    const normalizedLead = normalizeQuestionText(leadText);
    const normalizedQuestion = normalizeQuestionText(question);
    if (!normalizedLead || !normalizedQuestion) return false;

    if (normalizedLead === normalizedQuestion) return true;
    if (normalizedLead.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedLead)) {
        return true;
    }

    if (lang === 'zh') {
        const leadChars = buildHanCharSet(normalizedLead);
        const questionChars = buildHanCharSet(normalizedQuestion);
        const overlap = countSetOverlap(leadChars, questionChars);
        if (!overlap) return false;
        const leadCoverage = overlap / leadChars.size;
        const questionCoverage = overlap / questionChars.size;
        return leadCoverage >= 0.65 && questionCoverage >= 0.45;
    }

    const leadTokens = buildTokenSet(normalizedLead);
    const questionTokens = buildTokenSet(normalizedQuestion);
    const overlap = countSetOverlap(leadTokens, questionTokens);
    if (!overlap) return false;
    const leadCoverage = overlap / leadTokens.size;
    const questionCoverage = overlap / questionTokens.size;
    return leadCoverage >= 0.6 && questionCoverage >= 0.5;
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
        effect: { newsValueDelta: 3 }
    };
}

function isEvidenceChoice(choice) {
    return choice?.next === 'tutorial_ending';
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function playPreludeInterlude() {
    aiAvatarIntroPlayed = false;
    aiAvatarIntroRunning = false;
    const lines = [
        t('preludeLine1'),
        t('preludeLine2'),
        t('preludeLine3'),
        t('preludeLine4'),
        t('preludeLine5')
    ];
    lines.push(t('preludeLine6'));
    if (gameState.getState().aiEnabled) {
        lines.push(t('preludeLineAi'));
    }
    const filteredLines = lines.filter((line) => typeof line === 'string' && line.trim());

    if (!filteredLines.length) return;

    const existing = document.getElementById('prelude-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'prelude-overlay';
    overlay.innerHTML = `
        <div class="prelude-panel">
            <div class="prelude-line"></div>
            <span class="prelude-cursor" aria-hidden="true"></span>
        </div>
    `;
    document.body.appendChild(overlay);

    const lineEl = overlay.querySelector('.prelude-line');
    const assistant = document.getElementById('assistant');
    const previousVisibility = assistant ? assistant.style.visibility : '';
    if (assistant) assistant.style.visibility = 'hidden';

    try {
        for (const line of filteredLines) {
            lineEl.classList.remove('is-fading');
            lineEl.textContent = '';
            for (const ch of Array.from(line)) {
                lineEl.textContent += ch;
                await sleep(64);
            }
            await sleep(560);
            lineEl.classList.add('is-fading');
            await sleep(300);
        }
        await sleep(220);
    } finally {
        if (assistant) assistant.style.visibility = previousVisibility;
        overlay.remove();
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
    if (!footer) return;
    footer.style.display = 'block';
}

/**
 * 隐藏 Footer
 */
export function hideFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;
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

export function resetStatsFinalization() {
    statsFinalized = false;
}

function avgLikert(values = []) {
    const valid = values.filter((v) => Number.isFinite(v));
    if (!valid.length) return null;
    const sum = valid.reduce((acc, cur) => acc + cur, 0);
    return Math.round((sum / valid.length) * 100) / 100;
}

function generateRedeemCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 8; i += 1) {
        randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const date = new Date();
    const y = String(date.getFullYear()).slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `NG${y}${m}${d}-${randomPart}`;
}

function showPostTestSurveyModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('posttest-modal');
        const submitBtn = document.getElementById('posttest-submit-btn');
        if (!modal || !submitBtn) {
            resolve({});
            return;
        }

        const likertGroups = Array.from(modal.querySelectorAll('.post-likert'));
        const clearForm = () => {
            modal.querySelectorAll('input[type="radio"]').forEach((input) => {
                input.checked = false;
            });
            likertGroups.forEach((group) => {
                group.querySelectorAll('.intro-dot').forEach((dot) => dot.classList.remove('is-selected'));
            });
            ['post-open-1', 'post-open-2', 'post-open-3'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        };

        const bindLikert = () => {
            likertGroups.forEach((group) => {
                group.onclick = (event) => {
                    const target = event.target.closest('.intro-dot');
                    if (!target) return;
                    group.querySelectorAll('.intro-dot').forEach((dot) => dot.classList.remove('is-selected'));
                    target.classList.add('is-selected');
                };
            });
        };

        const getRadioValue = (name) => {
            const selected = modal.querySelector(`input[name="${name}"]:checked`);
            return selected ? selected.value : '';
        };

        const getLikertValue = (field) => {
            const selected = modal.querySelector(`.post-likert[data-field="${field}"] .intro-dot.is-selected`);
            return selected ? Number(selected.dataset.value) : null;
        };

        const collect = () => {
            const data = {
                manipulationProducer: getRadioValue('post-producer-type'),
                manipulationBestFormat: getRadioValue('post-best-format'),
                credibilityAccuracy: getLikertValue('credAccuracy'),
                credibilityTrust: getLikertValue('credTrust'),
                credibilityFair: getLikertValue('credFair'),
                credibilityDepth: getLikertValue('credDepth'),
                credibilityNeutral: getLikertValue('credNeutral'),
                emotionConcern: getLikertValue('emoConcern'),
                emotionSad: getLikertValue('emoSad'),
                emotionAngry: getLikertValue('emoAngry'),
                emotionHope: getLikertValue('emoHope'),
                emotionAnxious: getLikertValue('emoAnxious'),
                narrativeImmersed: getLikertValue('narImmersed'),
                narrativeChallenge: getLikertValue('narChallenge'),
                narrativeEmotion: getLikertValue('narEmotion'),
                narrativeImagine: getLikertValue('narImagine'),
                intentionShare: getLikertValue('intentShare'),
                intentionLearn: getLikertValue('intentLearn'),
                openFeedback1: document.getElementById('post-open-1')?.value?.trim() || '',
                openFeedback2: document.getElementById('post-open-2')?.value?.trim() || '',
                openFeedback3: document.getElementById('post-open-3')?.value?.trim() || ''
            };
            data.credibilityScore = avgLikert([
                data.credibilityAccuracy,
                data.credibilityTrust,
                data.credibilityFair,
                data.credibilityDepth,
                data.credibilityNeutral
            ]);
            data.emotionScore = avgLikert([
                data.emotionConcern,
                data.emotionSad,
                data.emotionAngry,
                data.emotionHope,
                data.emotionAnxious
            ]);
            data.narrativeScore = avgLikert([
                data.narrativeImmersed,
                data.narrativeChallenge,
                data.narrativeEmotion,
                data.narrativeImagine
            ]);
            data.behaviorScore = avgLikert([
                data.intentionShare,
                data.intentionLearn
            ]);
            return data;
        };

        const validate = (data) => {
            if (!data.manipulationProducer) return '请完成“新闻由谁制作”题。';
            if (!data.manipulationBestFormat) return '请完成“体验最好内容”题。';
            const requiredLikert = [
                data.credibilityAccuracy, data.credibilityTrust, data.credibilityFair, data.credibilityDepth, data.credibilityNeutral,
                data.emotionConcern, data.emotionSad, data.emotionAngry, data.emotionHope, data.emotionAnxious,
                data.narrativeImmersed, data.narrativeChallenge, data.narrativeEmotion, data.narrativeImagine,
                data.intentionShare, data.intentionLearn
            ];
            if (requiredLikert.some((v) => !Number.isFinite(v))) {
                return '请完成所有 1-5 分量表题后再提交。';
            }
            return '';
        };

        clearForm();
        bindLikert();
        modal.style.display = 'flex';
        const card = modal.querySelector('.posttest-card');
        if (card) card.scrollTop = 0;
        modal.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'auto' });
        const titleEl = modal.querySelector('.posttest-title');
        if (titleEl && typeof titleEl.scrollIntoView === 'function') {
            titleEl.scrollIntoView({ block: 'start' });
        }

        submitBtn.onclick = () => {
            const data = collect();
            const errorMsg = validate(data);
            if (errorMsg) {
                window.alert(errorMsg);
                return;
            }
            modal.style.display = 'none';
            resolve(data);
        };
    });
}

function showRewardModal(redeemCode) {
    return new Promise((resolve) => {
        const modal = document.getElementById('reward-modal');
        const codeEl = document.getElementById('reward-code');
        const submitBtn = document.getElementById('reward-submit-btn');
        const phoneWrap = document.getElementById('reward-phone-wrap');
        const wechatWrap = document.getElementById('reward-wechat-wrap');
        const phoneInput = document.getElementById('reward-phone-input');
        const methodInputs = Array.from(document.querySelectorAll('input[name="reward-contact-method"]'));
        if (!modal || !codeEl || !submitBtn || !phoneWrap || !wechatWrap || !phoneInput || !methodInputs.length) {
            resolve({
                redeemCode,
                contactMethod: 'wechat',
                luckinPhone: '',
                rewardStatus: 'pending_review'
            });
            return;
        }

        codeEl.textContent = redeemCode || '-';
        methodInputs.forEach((input) => {
            input.checked = input.value === 'wechat';
        });
        phoneInput.value = '';
        phoneWrap.style.display = 'none';
        wechatWrap.style.display = 'block';
        modal.style.display = 'flex';

        const refreshContactMode = () => {
            const current = methodInputs.find((input) => input.checked)?.value || 'wechat';
            if (current === 'phone') {
                phoneWrap.style.display = 'block';
                wechatWrap.style.display = 'none';
            } else {
                phoneWrap.style.display = 'none';
                wechatWrap.style.display = 'block';
            }
        };

        methodInputs.forEach((input) => {
            input.onchange = refreshContactMode;
        });

        submitBtn.onclick = () => {
            const contactMethod = methodInputs.find((input) => input.checked)?.value || 'wechat';
            const luckinPhone = (phoneInput.value || '').trim();
            if (contactMethod === 'phone') {
                if (!/^1\d{10}$/.test(luckinPhone)) {
                    window.alert('请填写有效的瑞幸绑定手机号（11位）。');
                    return;
                }
            }
            modal.style.display = 'none';
            resolve({
                redeemCode,
                contactMethod,
                luckinPhone: contactMethod === 'phone' ? luckinPhone : '',
                rewardStatus: 'pending_review'
            });
        };
    });
}

function buildStatsPayload() {
    const state = gameState.getState();
    const start = state.sessionStart || Date.now();
    const durationMs = Math.max(0, Date.now() - start);
    const choices = state.decisions.map((entry) => {
        return {
            sceneId: entry.sceneId,
            text: entry.choiceIntl ? localize(entry.choiceIntl) : entry.choiceText
        };
    });
    if (state.readingAssignment?.id) {
        choices.unshift({
            sceneId: 'reading_assignment',
            text: `[阅读材料] ${state.readingAssignment.source || state.readingAssignment.id}`
        });
    }
    return {
        name: state.playerName || '',
        aiEnabled: !!state.aiEnabled,
        clicks: state.clickCount || 0,
        distance: Math.round(state.mouseDistance || 0),
        aiInteractions: state.aiInteractions || 0,
        aiLogs: state.aiLogs || [],
        clickPoints: state.clickPoints || [],
        nonAiLogs: state.nonAiLogs || [],
        choices,
        newsValue: typeof state.newsValue === 'number' ? state.newsValue : 60,
        wildfireFamiliarity: state.wildfireFamiliarity || '',
        preSurvey: state.preSurvey || {},
        postSurvey: state.postSurvey || {},
        readingAssignment: state.readingAssignment || null,
        rewardInfo: state.rewardInfo || null,
        studyVariant: state.studyVariant || 'p1',
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

async function saveStatsToRemote(payload) {
    try {
        const response = await fetch(REMOTE_STATS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch {
        return false;
    }
}

function persistStats(payload) {
    // Always keep a local mirror so the frontend balancer can use recent counts.
    saveStatsToLocal(payload);
    saveStatsToRemote(payload).catch(() => null);
}

async function finalizeStats() {
    if (statsFinalized) return;
    if (!gameState.isTelemetryActive()) return;
    statsFinalized = true;
    const postSurvey = await showPostTestSurveyModal();
    gameState.setPostSurvey(postSurvey || {});
    if (gameState.getStudyVariant() === 'p1') {
        const redeemCode = generateRedeemCode();
        const rewardInfo = await showRewardModal(redeemCode);
        gameState.setRewardInfo(rewardInfo || null);
    } else {
        gameState.setRewardInfo(null);
    }
    gameState.setTelemetryActive(false);
    updateStatsPanel();
    persistStats(buildStatsPayload());
}
