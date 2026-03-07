const messages = {
    zh: {
        languageLabel: '语言',
        gameTitle: '灰烬中的城镇',
        loading: '加载中...',
        restart: '重新开始',
        introTitle: '开场任务',
        introBody: '你是一名采访记者，在信息不确定的山火现场追踪进展，在核实与时效之间维持平衡。所有线索来自新闻媒体与现场采访，AI 作为你的助手在一旁协作。',
        introNameLabel: '你的名字',
        introNamePlaceholder: '请输入姓名',
        introFamiliarityLabel: '是否了解加州山火事件',
        introFamiliarityYes: '了解',
        introFamiliarityNo: '不了解',
        introStart: '开始报道',
        preludeLine1: '接下来你将体验媒体工作者的一天。',
        preludeLine2: '你刚被派往加州山火现场，空气里全是灰烬味。',
        preludeLine3: '你在工作中致力于探寻真相，你的报告是读者的眼睛。',
        preludeLine4: '请确保让新闻价值达到 85，高质量选择与关键线索都会提高分数。',
        preludeLine5: '报道  开始。',
        preludeLineAi: '你获得了AI辅助系统协助。',
        preludeLine6: '',
        statsTitle: '采访记录',
        statsReporter: '记者',
        statsScore: '新闻价值',
        statsClicks: '鼠标点击',
        statsDistance: '移动距离',
        statsAi: 'AI 互动次数',
        statsChoices: '选择记录',
        liveBoardTitle: '实时看板',
        liveBoardSub: '加州野火 · 更新',
        sceneNotFound: '场景未找到',
        assistantFallback: '我在盯着最新进展。',
        assistantFollowup: '追问线索',
        assistantInterview: '委托采访',
        assistantRoleLabel: '采访对象',
        assistantQuestionPlaceholder: '输入你的提问...',
        assistantSend: '发送采访',
        assistantResponseTitle: 'AI 回复',
        assistantThinking: '对方正在输入中...',
        assistantGenerating: 'AI生成中',
        assistantSearching: '模拟在网页中搜索...',
        assistantReasoning: '正在思考中...',
        assistantConfigMissing: '尚未配置 AI 接口，请先填写 config/ai.json。',
        assistantRequestError: 'AI 请求失败，请稍后再试。',
        assistantNote: '提示：你是在委托 AI 完成采访与梳理线索。',
        aiMaskTitle: '教学提示：AI 助手怎么用',
        aiMaskBody: '点击“委托采访”选择采访对象，再输入问题；或点“追问线索”生成可直接使用的采访追问。AI 会帮你先抓线索，你再做核实与取舍。',
        aiMaskButton: '我明白了',
        evidenceTitle: '证据收集成功',
        evidenceBody: '你获得关键线索：红色液体来自附近油漆桶倒翻。',
        evidenceConfirm: '收下线索',

        leadSupplyTitle: '线索收集成功',

        leadIntroTitle: '线索收集成功',
        leadIntroBody: '有人在 01:40 前就上传过相关火光片段，疑似是旧素材。',
        leadRouteTitle: '线索收集成功',
        leadRouteBody: '北侧避难所人满为患，南侧仍有余量可转移。',
        leadShelterTitle: '线索收集成功',
        leadShelterBody: '登记处临时加铺，夜间已出现床位复用现象。',
        leadHospitalTitle: '线索收集成功',
        leadHospitalBody: '高风险人群被建议优先转移到清洁空气点。',
        leadLogisticsTitle: '线索收集成功',
        leadLogisticsBody: '车队在关键路口被迫改道，ETA 被延后。',
        leadDataTitle: '线索收集成功',
        leadDataBody: '两家媒体对控制率口径不同，时间戳不一致。',
        leadRumorTitle: '线索收集成功',
        leadRumorBody: '视频时间戳疑似被剪切，原始帧缺失。',
        leadOfficialTitle: '线索收集成功',
        leadOfficialBody: '官方用语出现“疑似”“待确认”的连续表述。',
        leadCommunityTitle: '线索收集成功',
        leadCommunityBody: '证言出现相互矛盾的地理描述，需标注层级。',
        leadVerifyTitle: '线索收集成功',
        leadVerifyBody: '仍缺少一条独立来源来交叉印证传闻。',
        leadDraftTitle: '线索收集成功',
        leadDraftBody: '读者更关注撤离路线与空气风险说明。',
        leadFinalTitle: '线索收集成功',
        leadFinalBody: '下一轮更新的关键点是传闻溯源结果。',
        leadSupplyBody: '避难所志愿者提到部分婴儿用品短缺，物资分配可能存在空档。',
        leadTriageTitle: '线索收集成功',
        leadTriageBody: '现场记者提到急诊区分流延迟，高风险人群出现等待堆积。',
        leadHazmatTitle: '线索收集成功',
        leadHazmatBody: '消防官员透露已调动危化品检测车，但结果尚未公布。',
        leadEvacTitle: '线索收集成功',
        leadEvacBody: 'AI 追问得到线索：某社区撤离通知存在延迟或遗漏。',
        shopHintTitle: '提示：关键线索',
        shopHintBody: '在“委托采访”中选择“便利店老板 许皓”，可能获得关键线索。',
        shopHintButton: '知道了',
        roleFire: '消防官员',
        roleResident: '撤离居民',
        roleVolunteer: '避难所志愿者',
        roleReporter: '现场记者',
        errorPrefix: '错误',
        storyLine: '线索/素材库',
        choiceFeedbackPositive: '新闻价值提升。你的选择更稳健，证据链更清晰。',
        choiceFeedbackNeutral: '新闻价值变化不大。保持核实与时效的平衡。',
        choiceFeedbackRisk: '新闻价值下滑。注意证据边界与误导风险。',
        stageEvaluation: '阶段性评估',
        endingReviewTitle: '结局复盘',
        endingChoices: '关键选择数',
        endingAiInteractions: 'AI 协作次数',
        endingSessionTime: '本局用时',
        endingReliability: '报道可靠度',
        endingHighlights: '本局亮点',
        endingImprove: '下次可优化',
        endingSeconds: (v) => `${v} 秒`,
        endingReliabilityHigh: '高',
        endingReliabilityMedium: '中',
        endingReliabilityLow: '低',
        angleUnknown: '尚未形成明显倾向',
        angleOfficial: '偏官方信息框架',
        angleCommunity: '偏社区/人情叙事',
        angleHype: '偏流量/刺激取向',
        angleBalanced: '平衡叙事'
    },
    en: {
        languageLabel: 'Language',
        gameTitle: 'Town in the Ashes',
        loading: 'Loading...',
        restart: 'Restart',
        introTitle: 'Your Assignment',
        introBody: 'You are a field reporter covering the wildfire under uncertainty, balancing verification with timeliness. Leads come from news reports and field interviews, with an AI assistant working alongside you.',
        introNameLabel: 'Your name',
        introNamePlaceholder: 'Enter your name',
        introFamiliarityLabel: 'Are you familiar with the California wildfires?',
        introFamiliarityYes: 'Familiar',
        introFamiliarityNo: 'Not familiar',
        introStart: 'Start reporting',
        preludeLine1: 'You are a media worker.',
        preludeLine2: 'In your work, you stay committed to the truth.',
        preludeLine3: 'Every hesitation gives rumors a head start.',
        preludeLine4: 'You have just been assigned to the California wildfire front; ash fills the air.',
        preludeLine5: 'Goal: reach Story Value 85+ to unlock the trusted ending. Strong choices and key leads both raise your score.',
        preludeLineAi: 'You have gained support from an AI assistant system.',
        preludeLine6: 'The report begins.',
        statsTitle: 'Reporting Log',
        statsReporter: 'Reporter',
        statsScore: 'Story value',
        statsClicks: 'Clicks',
        statsDistance: 'Distance moved',
        statsAi: 'AI interactions',
        statsChoices: 'Choice log',
        liveBoardTitle: 'Live Board',
        liveBoardSub: 'California Wildfire · Updates',
        sceneNotFound: 'Scene not found',
        assistantFallback: 'I am tracking the latest updates.',
        assistantFollowup: 'Follow-up',
        assistantInterview: 'Delegate interview',
        assistantRoleLabel: 'Interviewee',
        assistantQuestionPlaceholder: 'Type your question...',
        assistantSend: 'Send',
        assistantResponseTitle: 'AI Reply',
        assistantThinking: 'Typing...',
        assistantGenerating: 'AI generating...',
        assistantSearching: 'Simulating web search...',
        assistantReasoning: 'Thinking...',
        assistantConfigMissing: 'AI config missing. Please fill config/ai.json first.',
        assistantRequestError: 'AI request failed. Please try again.',
        assistantNote: 'Tip: You are delegating interviews and lead-gathering to the AI.',
        aiMaskTitle: 'Tutorial: How to use the AI',
        aiMaskBody: 'Click “Delegate interview” to pick an interviewee and ask a question, or click “Follow-up” to generate ready-to-use interview prompts. The AI surfaces leads; you verify and decide.',
        aiMaskButton: 'Got it',
        evidenceTitle: 'Evidence Collected',
        evidenceBody: 'Key lead found: the red liquid came from a toppled paint bucket nearby.',
        evidenceConfirm: 'Collect',

        leadSupplyTitle: 'Evidence Collected',

        leadIntroTitle: 'Evidence Collected',
        leadIntroBody: 'A clip appeared before 1:40 a.m., suggesting recycled footage.',
        leadRouteTitle: 'Evidence Collected',
        leadRouteBody: 'North shelter is over capacity while the south still has room.',
        leadShelterTitle: 'Evidence Collected',
        leadShelterBody: 'Beds are being reused overnight as overflow grows.',
        leadHospitalTitle: 'Evidence Collected',
        leadHospitalBody: 'High‑risk groups are advised to move to clean‑air points.',
        leadLogisticsTitle: 'Evidence Collected',
        leadLogisticsBody: 'Convoys detoured at a key junction and ETA slipped.',
        leadDataTitle: 'Evidence Collected',
        leadDataBody: 'Containment figures differ across outlets and timestamps.',
        leadRumorTitle: 'Evidence Collected',
        leadRumorBody: 'The clip’s timestamp appears trimmed; original frames missing.',
        leadOfficialTitle: 'Evidence Collected',
        leadOfficialBody: 'Official wording repeatedly uses “suspected” and “pending.”',
        leadCommunityTitle: 'Evidence Collected',
        leadCommunityBody: 'Testimonies contradict on location details; levels must be marked.',
        leadVerifyTitle: 'Evidence Collected',
        leadVerifyBody: 'One independent source is still missing to cross‑verify.',
        leadDraftTitle: 'Evidence Collected',
        leadDraftBody: 'Readers focus on evacuation routes and air‑risk guidance.',
        leadFinalTitle: 'Evidence Collected',
        leadFinalBody: 'Next update hinges on the rumor source trace.',
        leadSupplyBody: 'A shelter volunteer mentions shortages of baby supplies, suggesting gaps in distribution.',
        leadTriageTitle: 'Evidence Collected',
        leadTriageBody: 'A field reporter notes ER triage delays and a buildup of high‑risk patients.',
        leadHazmatTitle: 'Evidence Collected',
        leadHazmatBody: 'A fire official says hazmat detection units have been deployed, results pending.',
        leadEvacTitle: 'Evidence Collected',
        leadEvacBody: 'AI follow‑up suggests one community’s evacuation notice was delayed or missed.',
        shopHintTitle: 'Hint: Key Lead',
        shopHintBody: 'In “Delegate interview,” choose “Shop owner Xu Hao” to unlock a key lead.',
        shopHintButton: 'Got it',
        roleFire: 'Fire official',
        roleResident: 'Evacuee',
        roleVolunteer: 'Shelter volunteer',
        roleReporter: 'Field reporter',
        errorPrefix: 'Error',
        storyLine: 'Leads / Evidence',
        choiceFeedbackPositive: 'Story value rises. Your choice strengthens the evidence chain.',
        choiceFeedbackNeutral: 'Story value stays steady. Keep balancing verification and speed.',
        choiceFeedbackRisk: 'Story value drops. Mind evidence boundaries and misinformation risk.',
        stageEvaluation: 'Stage Check',
        endingReviewTitle: 'Endgame Debrief',
        endingChoices: 'Key choices',
        endingAiInteractions: 'AI assists',
        endingSessionTime: 'Session time',
        endingReliability: 'Report reliability',
        endingHighlights: 'What worked',
        endingImprove: 'What to improve',
        endingSeconds: (v) => `${v}s`,
        endingReliabilityHigh: 'High',
        endingReliabilityMedium: 'Medium',
        endingReliabilityLow: 'Low',
        angleUnknown: 'No clear leaning yet',
        angleOfficial: 'Official-leaning',
        angleCommunity: 'Community/people-first',
        angleHype: 'Click-driven',
        angleBalanced: 'Balanced'
    }
};

let currentLanguage = 'zh';
const listeners = new Set();

export function setLanguage(lang) {
    if (!messages[lang]) return;
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    listeners.forEach(fn => fn(currentLanguage));
}

export function getLanguage() {
    return currentLanguage;
}

export function t(key, ...args) {
    const langTable = messages[currentLanguage] || messages.zh;
    const fallback = messages.zh;
    const value = langTable[key] ?? fallback[key] ?? key;
    if (typeof value === 'function') {
        try {
            return value(...args);
        } catch {
            return value;
        }
    }
    return value;
}

export function localize(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (value[currentLanguage]) return value[currentLanguage];
        if (value.zh) return value.zh;
        const first = Object.values(value)[0];
        if (typeof first === 'string') return first;
    }
    return '';
}

export function onLanguageChange(fn) {
    if (typeof fn !== 'function') return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
}

document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
