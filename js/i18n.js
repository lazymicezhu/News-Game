const messages = {
    zh: {
        languageLabel: '语言',
        gameTitle: '灰烬中的城镇',
        loading: '加载中...',
        restart: '重新开始',
        introTitle: '开场任务',
        introBody: '你是一名采访记者，需要在信息不确定的情况下持续追踪山火事件，并在核实与时效之间做出取舍。本游戏信息来自新闻媒体报道，你将委托 AI 助手采访与整理线索。先完成一个简短教学关，再进入正式报道。',
        introNameLabel: '你的名字',
        introNamePlaceholder: '请输入姓名',
        introFamiliarityLabel: '是否了解加州山火事件',
        introFamiliarityYes: '了解',
        introFamiliarityNo: '不了解',
        introStart: '开始报道',
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
        introBody: 'You are a field reporter covering the wildfire under uncertainty, balancing verification with timeliness. This game draws from news reporting. You will delegate interviews and lead gathering to an AI assistant. Complete a short tutorial first, then proceed.',
        introNameLabel: 'Your name',
        introNamePlaceholder: 'Enter your name',
        introFamiliarityLabel: 'Are you familiar with the California wildfires?',
        introFamiliarityYes: 'Familiar',
        introFamiliarityNo: 'Not familiar',
        introStart: 'Start reporting',
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
