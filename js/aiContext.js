import { getLanguage } from './i18n.js';

const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
const backgroundCache = { base: null, roles: new Map() };

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
