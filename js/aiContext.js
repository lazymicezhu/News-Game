import { getLanguage } from './i18n.js';

const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
const backgroundCache = { base: null, roles: new Map() };
const defaultPrompts = {
    followup: {
        zh: '你是新闻编辑助理。基于提供的背景回答追问，语气自然、像助手在对话中解释。不要使用 Markdown，不要使用编号或列表，输出一段连贯的文字，保持简洁具体。总长度控制在 75 字以内。请在回答末尾用一句话提示信息可靠度（高/中/低）与依据，并用中文全角括号包裹，例如：（可靠度：中，依据：单一目击描述）。',
        en: 'You are a newsroom assistant. Answer the follow-up based on the provided background in a natural, conversational tone. Do not use Markdown, numbering, or bullet lists. Reply as a single coherent paragraph, concise and specific. Keep the total length within 75 Chinese characters or about 60 English words. End with one sentence stating the confidence (high/medium/low) and the basis, wrapped in parentheses, for example: (Confidence: medium, basis: a single eyewitness account).'
    },
    interview: {
        zh: '你正在接受记者采访。请根据角色背景作答，语气自然、像在对话中回答。不要使用 Markdown，不要使用编号或列表，输出一段连贯的文字，保持简短具体。总长度控制在 50 字以内。请在回答末尾用一句话说明信息局限或视角偏差，并用中文全角括号包裹，例如：（信息局限：主要来自现场观察，可能不完整）。',
        en: 'You are being interviewed. Answer based on the role background in a natural, conversational tone. Do not use Markdown, numbering, or bullet lists. Reply as a single coherent paragraph, concise and specific. Keep the total length within 50 Chinese characters or about 40 English words. End with one sentence noting limitations or perspective bias, wrapped in parentheses, such as (Limitations: mostly from on-site observations and may be incomplete).'
    }
};

function loadOverrides() {
    try {
        return JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

async function fetchJson(path) {
    try {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function pickLang(value, lang) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.zh || value.en || '';
}

export async function getAiBackground() {
    const lang = getLanguage();
    const overrides = loadOverrides();
    const override = overrides.aiBackground;
    if (override && (override.zh || override.en)) {
        return pickLang(override, lang);
    }
    if (!backgroundCache.base) {
        backgroundCache.base = await fetchJson('data/aiBackground.json');
    }
    return pickLang(backgroundCache.base, lang);
}

export async function getRoleBackground(roleId) {
    if (!roleId) return '';
    const lang = getLanguage();
    const overrides = loadOverrides();
    const override = overrides.interviewRoleBackgrounds?.[roleId];
    if (override && (override.zh || override.en)) {
        return pickLang(override, lang);
    }
    if (!backgroundCache.roles.has(roleId)) {
        const data = await fetchJson(`data/roleBackgrounds/${roleId}.json`);
        backgroundCache.roles.set(roleId, data);
    }
    return pickLang(backgroundCache.roles.get(roleId), lang);
}

export function getAiPrompts() {
    const overrides = loadOverrides();
    const override = overrides.aiPrompts || {};
    return {
        followup: {
            zh: override.followup?.zh || defaultPrompts.followup.zh,
            en: override.followup?.en || defaultPrompts.followup.en
        },
        interview: {
            zh: override.interview?.zh || defaultPrompts.interview.zh,
            en: override.interview?.en || defaultPrompts.interview.en
        }
    };
}
