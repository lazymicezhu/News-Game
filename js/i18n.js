const messages = {
    zh: {
        languageLabel: '语言',
        gameTitle: '灰烬中的城镇',
        loading: '加载中...',
        restart: '重新开始',
        liveBoardTitle: '实时看板',
        liveBoardSub: '加州野火 · 更新',
        sceneNotFound: '场景未找到',
        assistantFallback: '我在盯着最新进展。',
        assistantFollowup: '追问证据',
        assistantInterview: '角色采访',
        assistantRoleLabel: '采访对象',
        assistantQuestionPlaceholder: '输入你的提问...',
        assistantSend: '发送采访',
        assistantResponseTitle: 'AI 回复',
        assistantThinking: '对方正在输入中...',
        assistantConfigMissing: '尚未配置 AI 接口，请先填写 config/ai.json。',
        assistantRequestError: 'AI 请求失败，请稍后再试。',
        roleFire: '消防官员',
        roleResident: '撤离居民',
        roleVolunteer: '避难所志愿者',
        roleReporter: '现场记者',
        errorPrefix: '错误',
        storyLine: '故事线',
        recapTitle: '你的报道摘要',
        recapDecisions: '关键决策回放',
        noDecisions: '你还没有做出任何选择。',
        angleUnknown: '尚未形成明显倾向',
        decisionEntry: (scene, choice) => `在【${scene}】，你选择：${choice}`,
        summaryText: (angleText, decisionCount) => `报道倾向：${angleText}。本次共做出 ${decisionCount} 次关键选择。`,
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
        liveBoardTitle: 'Live Board',
        liveBoardSub: 'California Wildfire · Updates',
        sceneNotFound: 'Scene not found',
        assistantFallback: 'I am tracking the latest updates.',
        assistantFollowup: 'Follow-up',
        assistantInterview: 'Role interview',
        assistantRoleLabel: 'Interviewee',
        assistantQuestionPlaceholder: 'Type your question...',
        assistantSend: 'Send',
        assistantResponseTitle: 'AI Reply',
        assistantThinking: 'Typing...',
        assistantConfigMissing: 'AI config missing. Please fill config/ai.json first.',
        assistantRequestError: 'AI request failed. Please try again.',
        roleFire: 'Fire official',
        roleResident: 'Evacuee',
        roleVolunteer: 'Shelter volunteer',
        roleReporter: 'Field reporter',
        errorPrefix: 'Error',
        storyLine: 'Storyline',
        recapTitle: 'Your story recap',
        recapDecisions: 'Key decisions',
        noDecisions: 'You have not made any choices yet.',
        angleUnknown: 'No clear leaning yet',
        decisionEntry: (scene, choice) => `At [${scene}], you chose: ${choice}`,
        summaryText: (angleText, decisionCount) => `Story leaning: ${angleText}. You made ${decisionCount} key choices.`,
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
