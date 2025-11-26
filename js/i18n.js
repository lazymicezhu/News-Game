const messages = {
    zh: {
        languageLabel: '语言',
        gameTitle: '灰烬中的城镇',
        evidenceToggle: '证据与来源',
        loading: '加载中...',
        restart: '重新开始',
        evidenceDrawerTitle: '证据卡片',
        liveBoardTitle: '实时看板',
        liveBoardSub: '加州野火 · 更新',
        sceneNotFound: '场景未找到',
        unverifiedWarning: '尚未证实 · 请谨慎',
        assistantPrompt: '这里有证据，你的判断是？',
        assistantNoEvidence: '当前没有证据卡片，我会继续帮你关注。',
        credibilityLabel: '来源可信度：',
        credibilityUnknown: '来源可信度：未标注',
        statusTrusted: '相信',
        statusDoubtful: '存疑',
        statusViewed: '已阅',
        yourMark: '你的标记：',
        unmarked: '未标记',
        markedEvidence: '已标记的证据',
        close: '关闭',
        noEvidenceMarks: '还没有标记过证据。',
        errorPrefix: '错误',
        storyLine: '故事线',
        recapTitle: '你的报道摘要',
        recapDecisions: '关键决策回放',
        evidenceMarks: '证据标记',
        trustedCount: '相信',
        doubtfulCount: '存疑',
        viewedCount: '已阅',
        noDecisions: '你还没有做出任何选择。',
        angleUnknown: '尚未形成明显倾向',
        decisionEntry: (scene, choice) => `在【${scene}】，你选择：${choice}`,
        summaryText: (angleText, unverifiedCount, trustScore) => `报道倾向：${angleText}。未证实信息使用 ${unverifiedCount} 次。综合可信度预估：${trustScore} / 100（越高代表引用来源越充分、标注越清晰）。`,
        angleOfficial: '偏官方信息框架',
        angleCommunity: '偏社区/人情叙事',
        angleHype: '偏流量/刺激取向',
        angleBalanced: '平衡且求证',
        assistantMinimize: '最小化',
        assistantExpand: '展开'
    },
    en: {
        languageLabel: 'Language',
        gameTitle: 'Town in the Ashes',
        evidenceToggle: 'Evidence & Sources',
        loading: 'Loading...',
        restart: 'Restart',
        evidenceDrawerTitle: 'Evidence Cards',
        liveBoardTitle: 'Live Board',
        liveBoardSub: 'California Wildfire · Updates',
        sceneNotFound: 'Scene not found',
        unverifiedWarning: 'Unverified · Proceed carefully',
        assistantPrompt: 'Evidence available—what is your take?',
        assistantNoEvidence: 'No evidence cards right now; I will keep watching.',
        credibilityLabel: 'Source credibility:',
        credibilityUnknown: 'Source credibility: not noted',
        statusTrusted: 'Trust',
        statusDoubtful: 'Doubt',
        statusViewed: 'Seen',
        yourMark: 'Your mark:',
        unmarked: 'Unmarked',
        markedEvidence: 'Marked evidence',
        close: 'Close',
        noEvidenceMarks: 'No evidence marked yet.',
        errorPrefix: 'Error',
        storyLine: 'Storyline',
        recapTitle: 'Your story recap',
        recapDecisions: 'Key decisions',
        evidenceMarks: 'Evidence marks',
        trustedCount: 'Trusted',
        doubtfulCount: 'Doubtful',
        viewedCount: 'Seen',
        noDecisions: 'You have not made any choices yet.',
        angleUnknown: 'No clear leaning yet',
        decisionEntry: (scene, choice) => `At [${scene}], you chose: ${choice}`,
        summaryText: (angleText, unverifiedCount, trustScore) => `Story leaning: ${angleText}. Unverified info used ${unverifiedCount} times. Estimated credibility: ${trustScore} / 100 (higher means better sourcing and clarity).`,
        angleOfficial: 'Official-leaning',
        angleCommunity: 'Community/people-first',
        angleHype: 'Click-driven',
        angleBalanced: 'Balanced and verified',
        assistantMinimize: 'Minimize',
        assistantExpand: 'Expand'
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
