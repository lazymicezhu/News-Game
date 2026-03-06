import { scenes as baseScenes } from './scenes.js';
import { interviewRoles as baseInterviewRoles } from '../data/interviewRoles.js';
import { streamChat, isAiConfigured } from './aiClient.js';
import { getAiPrompts } from './aiContext.js';

const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
const ADMIN_TOKEN_STORAGE_KEY = 'newsgame-admin-token';
const REMOTE_STATS_ENDPOINT = 'https://newsgame-egxdvooreq.cn-hangzhou.fcapp.run/responses';
let editorLang = 'zh';
let aiAvailablePromise = null;
const aiBackgroundCache = { base: null, roles: new Map() };
let statsCache = [];

function formatTime(ts) {
    if (!ts) return '-';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
}

function formatDuration(ms) {
    if (!ms && ms !== 0) return '-';
    const seconds = Math.max(0, Math.round(ms / 1000));
    return `${seconds}`;
}

function setDataStatus(mode, message) {
    const badge = document.getElementById('admin-data-status-badge');
    const text = document.getElementById('admin-data-status-text');
    const time = document.getElementById('admin-data-status-time');
    if (!badge || !text || !time) return;

    badge.classList.remove('is-cloud', 'is-local', 'is-error', 'is-loading');

    if (mode === 'cloud') {
        badge.classList.add('is-cloud');
        badge.textContent = '云端';
    } else if (mode === 'local') {
        badge.classList.add('is-local');
        badge.textContent = '本地回退';
    } else if (mode === 'error') {
        badge.classList.add('is-error');
        badge.textContent = '读取失败';
    } else {
        badge.classList.add('is-loading');
        badge.textContent = '读取中';
    }

    text.textContent = message || '';
    time.textContent = `更新时间：${new Date().toLocaleTimeString()}`;
}

function loadStats() {
    try {
        return JSON.parse(localStorage.getItem('newsgame-stats') || '[]');
    } catch {
        return [];
    }
}

function safeJsonParse(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function getArticleTypeFromReadingAssignment(readingAssignment) {
    const id = String(readingAssignment?.id || '').toLowerCase();
    if (id.includes('ai_news') || id.includes('ai-news')) return 'ai_news';
    if (id.includes('ap_news') || id.includes('ap-news')) return 'human_news';
    const source = String(readingAssignment?.source || '').toLowerCase();
    if (source.includes('ai-news') || source.includes('ai news')) return 'ai_news';
    if (source.includes('ap-news') || source.includes('ap news')) return 'human_news';
    return '';
}

function getArticleTypeFromChoices(choices) {
    const list = Array.isArray(choices) ? choices : [];
    const marker = list.find((item) => item && item.sceneId === 'reading_assignment');
    const text = String(marker?.text || '').toLowerCase();
    if (!text) return '';
    if (text.includes('ai-news') || text.includes('ai news')) return 'ai_news';
    if (text.includes('ap-news') || text.includes('ap news')) return 'human_news';
    return '';
}

function getArticleTypeFromEntry(entry) {
    const byAssignment = getArticleTypeFromReadingAssignment(entry?.readingAssignment);
    if (byAssignment) return byAssignment;
    return getArticleTypeFromChoices(entry?.choices);
}

function getAssignmentGroupKey(entry) {
    const articleType = getArticleTypeFromEntry(entry) || 'human_news';
    const gameType = entry?.aiEnabled ? 'ai_game' : 'nonai_game';
    return `${articleType}__${gameType}`;
}

function getNewsVersionLabel(entry) {
    const articleType = getArticleTypeFromEntry(entry);
    if (articleType === 'ai_news') return 'AI新闻';
    if (articleType === 'human_news') return '人类新闻';
    return '新闻未知';
}

function mapPostValue(field, value) {
    const raw = String(value || '');
    if (!raw) return '';
    if (field === 'manipulationProducer') {
        if (raw === 'human') return '人类记者';
        if (raw === 'ai') return 'AI';
        if (raw === 'unsure') return '不确定';
    }
    if (field === 'manipulationBestFormat') {
        if (raw === 'text_news') return '传统文本新闻';
        if (raw === 'interactive_game') return '互动新闻游戏';
    }
    return raw;
}

function getAdminToken() {
    const cached = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
    if (cached) return cached;
    const input = window.prompt('请输入管理员 Token（x-admin-token）');
    const token = (input || '').trim();
    if (token) localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    return token;
}

function normalizeRemoteEntry(entry) {
    const createdAt = entry?.created_at ? new Date(entry.created_at).getTime() : Date.now();
    const preNewsSources = safeJsonParse(entry?.pre_news_sources_json, []);
    const choices = safeJsonParse(entry?.choices_json, []);
    const readingAssignment = safeJsonParse(entry?.reading_assignment_json, null);
    const postSurvey = safeJsonParse(entry?.post_survey_json, {});
    return {
        id: entry?.id,
        name: entry?.name || '',
        aiEnabled: !!entry?.ai_enabled,
        clicks: Number(entry?.clicks || 0),
        distance: Number(entry?.distance || 0),
        aiInteractions: Number(entry?.ai_interactions || 0),
        newsValue: Number(entry?.news_value || 60),
        wildfireFamiliarity: entry?.wildfire_familiarity || '',
        durationMs: Number(entry?.duration_ms || 0),
        choices,
        aiLogs: safeJsonParse(entry?.ai_logs_json, []),
        nonAiLogs: safeJsonParse(entry?.non_ai_logs_json, []),
        readingAssignment: readingAssignment || null,
        postSurvey: postSurvey && typeof postSurvey === 'object' ? postSurvey : {},
        preSurvey: {
            aiReliable: entry?.pre_ai_reliable ?? null,
            aiCredible: entry?.pre_ai_credible ?? null,
            aiUncertain: entry?.pre_ai_uncertain ?? null,
            newsFrequency: entry?.pre_news_frequency || '',
            newsSources: Array.isArray(preNewsSources) ? preNewsSources : [],
            gameFrequency: entry?.pre_game_frequency || '',
            storyGameFamiliarity: entry?.pre_story_game_familiarity ?? null
        },
        timestamp: Number.isNaN(createdAt) ? Date.now() : createdAt
    };
}

async function fetchRemoteStats() {
    const token = getAdminToken();
    if (!token) {
        return { ok: false, error: 'missing_token', list: [] };
    }
    try {
        const response = await fetch(`${REMOTE_STATS_ENDPOINT}?page=1&pageSize=500`, {
            headers: {
                'x-admin-token': token
            }
        });
        if (response.status === 401) {
            localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
            window.alert('管理员 Token 无效，请重新输入。');
            return { ok: false, error: 'unauthorized', list: [] };
        }
        if (!response.ok) {
            return { ok: false, error: `http_${response.status}`, list: [] };
        }
        const payload = await response.json();
        const list = Array.isArray(payload?.list) ? payload.list.map(normalizeRemoteEntry) : [];
        return { ok: true, list };
    } catch {
        return { ok: false, error: 'network', list: [] };
    }
}

function saveStats(list) {
    localStorage.setItem('newsgame-stats', JSON.stringify(list));
}

function loadOverrides() {
    try {
        return JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveOverrides(data) {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(data));
}

async function exportOverrides() {
    const overrides = loadOverrides();
    const mergedScenes = mergeScenes(baseScenes, overrides.scenes || {});
    const baseBackground = await loadAiBackgroundDefault();
    const prompts = getAiPrompts();
    const aiBackground = {
        zh: overrides.aiBackground?.zh ?? baseBackground?.zh ?? '',
        en: overrides.aiBackground?.en ?? baseBackground?.en ?? ''
    };
    const aiPrompts = {
        followup: {
            zh: prompts.followup.zh || '',
            en: prompts.followup.en || ''
        },
        interview: {
            zh: prompts.interview.zh || '',
            en: prompts.interview.en || ''
        }
    };
    const interviewRoleBackgrounds = {};
    for (const role of baseInterviewRoles) {
        const roleId = role.id;
        const baseRole = await loadRoleBackgroundDefault(roleId);
        const overrideRole = overrides.interviewRoleBackgrounds?.[roleId];
        interviewRoleBackgrounds[roleId] = {
            zh: overrideRole?.zh ?? baseRole?.zh ?? '',
            en: overrideRole?.en ?? baseRole?.en ?? ''
        };
    }
    const data = {
        scenes: mergedScenes,
        aiBackground,
        aiPrompts,
        interviewRoleBackgrounds
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `newsgame-overrides-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function bindConfigTransfer() {
    const exportBtn = document.getElementById('admin-config-export');
    const importBtn = document.getElementById('admin-config-import');
    const fileInput = document.getElementById('admin-config-file');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportOverrides();
        });
    }
    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                saveOverrides(data || {});
                window.location.reload();
            } catch {
                window.alert('导入失败：文件格式不正确。');
            } finally {
                fileInput.value = '';
            }
        });
    }
}

function mergeScenes(base, overrides = {}) {
    const merged = {};
    Object.entries(base || {}).forEach(([sceneId, scene]) => {
        const baseScene = scene || {};
        const nextScene = {
            ...baseScene,
            title: baseScene.title ? { ...baseScene.title } : undefined,
            text: baseScene.text ? { ...baseScene.text } : undefined,
            choices: Array.isArray(baseScene.choices)
                ? baseScene.choices.map((choice) => ({
                    ...choice,
                    text: choice.text ? { ...choice.text } : choice.text,
                    hint: choice.hint ? { ...choice.hint } : choice.hint
                }))
                : []
        };
        const override = overrides[sceneId];
        if (override) {
            if (override.title) nextScene.title = { ...(nextScene.title || {}), ...override.title };
            if (override.text) nextScene.text = { ...(nextScene.text || {}), ...override.text };
            if (Object.prototype.hasOwnProperty.call(override, 'image')) {
                nextScene.image = override.image || '';
            }
            if (Array.isArray(override.choices)) {
                nextScene.choices = override.choices.map((choice) => ({
                    ...choice,
                    text: choice.text ? { ...choice.text } : choice.text,
                    hint: choice.hint ? { ...choice.hint } : choice.hint
                }));
            }
        }
        merged[sceneId] = nextScene;
    });

    Object.entries(overrides || {}).forEach(([sceneId, override]) => {
        if (!merged[sceneId]) {
            merged[sceneId] = {
                ...override,
                title: override.title ? { ...override.title } : undefined,
                text: override.text ? { ...override.text } : undefined,
                choices: Array.isArray(override.choices)
                    ? override.choices.map((choice) => ({
                        ...choice,
                        text: choice.text ? { ...choice.text } : choice.text,
                        hint: choice.hint ? { ...choice.hint } : choice.hint
                    }))
                    : []
            };
        }
    });
    return merged;
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

async function loadAiBackgroundDefault() {
    if (!aiBackgroundCache.base) {
        aiBackgroundCache.base = await fetchJson('data/aiBackground.json');
    }
    return aiBackgroundCache.base || {};
}

async function loadRoleBackgroundDefault(roleId) {
    if (!aiBackgroundCache.roles.has(roleId)) {
        const data = await fetchJson(`data/roleBackgrounds/${roleId}.json`);
        aiBackgroundCache.roles.set(roleId, data || {});
    }
    return aiBackgroundCache.roles.get(roleId) || {};
}

function getAiAvailable() {
    if (!aiAvailablePromise) {
        aiAvailablePromise = isAiConfigured();
    }
    return aiAvailablePromise;
}

async function translateText(text, fromLang, toLang, aiAvailable) {
    if (!text) return '';
    if (!aiAvailable) return text;
    let result = '';
    try {
        await streamChat({
            messages: [
                {
                    role: 'system',
                    content: fromLang === 'zh'
                        ? '将中文翻译成英文。只输出译文，不要添加解释。'
                        : 'Translate the text into Chinese. Output only the translation.'
                },
                { role: 'user', content: text }
            ],
            onToken: (token) => {
                result += token;
            }
        });
        return result.trim();
    } catch {
        return text;
    }
}

function renderRows(stats = statsCache) {
    const tbody = document.getElementById('admin-rows');
    if (!tbody) return;
    tbody.innerHTML = '';
    const rows = (Array.isArray(stats) ? stats : [])
        .map((entry, sourceIndex) => ({ ...entry, __sourceIndex: sourceIndex }))
        .sort((a, b) => {
            const aId = Number(a.id);
            const bId = Number(b.id);
            const aKey = Number.isFinite(aId) && aId > 0 ? aId : Number(a.timestamp || 0);
            const bKey = Number.isFinite(bId) && bId > 0 ? bId : Number(b.timestamp || 0);
            return aKey - bKey;
        });
    rows.forEach((entry, index) => {
        const tr = document.createElement('tr');
        const choices = Array.isArray(entry.choices) ? entry.choices : [];
        const logs = Array.isArray(entry.aiLogs) ? entry.aiLogs : [];
        const nonAiLogs = Array.isArray(entry.nonAiLogs) ? entry.nonAiLogs : [];
        const logsByScene = logs.reduce((acc, log) => {
            const key = log.sceneId || '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(log);
            return acc;
        }, {});
        const nonAiByScene = nonAiLogs.reduce((acc, log) => {
            const key = log.sceneId || '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(log);
            return acc;
        }, {});
        const choiceLines = choices.map((choice, index) => {
            const choiceText = typeof choice === 'string' ? choice : (choice.text || '-');
            const sceneId = typeof choice === 'string' ? '' : (choice.sceneId || '');
            const relatedLogs = sceneId ? (logsByScene[sceneId] || []) : [];
            const relatedNonAi = sceneId ? (nonAiByScene[sceneId] || []) : [];
            const aiLines = relatedLogs.map((log) => {
                const type = log.type === 'interview' ? '采访' : '追问';
                const role = log.role ? `(${log.role})` : '';
                const q = log.question ? `Q: ${log.question}` : '';
                const a = log.response ? `A: ${log.response}` : '';
                return `<div class="admin-ai-log">${type}${role} ${q} ${a}</div>`;
            }).join('');
            const hintLines = relatedNonAi.map((log) => {
                const hint = log.hint ? `提示：${log.hint}` : '';
                return hint ? `<div class="admin-hint-log">${hint}</div>` : '';
            }).join('');
            return `
                <div class="admin-choice-row">
                    <div>${index + 1}. ${choiceText}</div>
                    ${aiLines}
                    ${hintLines}
                </div>
            `;
        }).join('');
        const score = typeof entry.newsValue === 'number' ? entry.newsValue : 60;
        const preSurvey = entry.preSurvey || {};
        const postSurvey = entry.postSurvey || {};
        const preLines = [];
        if (preSurvey.aiReliable) preLines.push(`AI可靠: ${preSurvey.aiReliable}`);
        if (preSurvey.aiCredible) preLines.push(`AI可信: ${preSurvey.aiCredible}`);
        if (preSurvey.aiUncertain) preLines.push(`AI不确定: ${preSurvey.aiUncertain}`);
        if (entry.wildfireFamiliarity === 'yes') preLines.push('是否了解山火: 了解');
        if (entry.wildfireFamiliarity === 'no') preLines.push('是否了解山火: 不了解');
        if (preSurvey.newsFrequency) preLines.push(`看新闻: ${preSurvey.newsFrequency}`);
        if (Array.isArray(preSurvey.newsSources) && preSurvey.newsSources.length) {
            preLines.push(`新闻渠道: ${preSurvey.newsSources.join(',')}`);
        }
        if (preSurvey.gameFrequency) preLines.push(`玩游戏: ${preSurvey.gameFrequency}`);
        if (preSurvey.storyGameFamiliarity) preLines.push(`叙事游戏熟悉度: ${preSurvey.storyGameFamiliarity}`);
        const postFilled = Object.keys(postSurvey).length > 0;
        preLines.push(`后测: ${postFilled ? '已填写' : '未填写'}`);
        if (postFilled) {
            if (postSurvey.manipulationProducer) preLines.push(`后测-新闻作者感知: ${mapPostValue('manipulationProducer', postSurvey.manipulationProducer)}`);
            if (postSurvey.manipulationBestFormat) preLines.push(`后测-最佳体验形式: ${mapPostValue('manipulationBestFormat', postSurvey.manipulationBestFormat)}`);
            if (postSurvey.credibilityScore !== null && postSurvey.credibilityScore !== undefined) {
                preLines.push(`后测-可信度总分: ${postSurvey.credibilityScore}`);
            }
            if (postSurvey.emotionScore !== null && postSurvey.emotionScore !== undefined) {
                preLines.push(`后测-情绪参与总分: ${postSurvey.emotionScore}`);
            }
            if (postSurvey.narrativeScore !== null && postSurvey.narrativeScore !== undefined) {
                preLines.push(`后测-叙事沉浸总分: ${postSurvey.narrativeScore}`);
            }
            if (postSurvey.behaviorScore !== null && postSurvey.behaviorScore !== undefined) {
                preLines.push(`后测-行为意图总分: ${postSurvey.behaviorScore}`);
            }
            if (postSurvey.openFeedback1) preLines.push(`后测-开放题1: ${String(postSurvey.openFeedback1).slice(0, 120)}`);
            if (postSurvey.openFeedback2) preLines.push(`后测-开放题2: ${String(postSurvey.openFeedback2).slice(0, 120)}`);
            if (postSurvey.openFeedback3) preLines.push(`后测-开放题3: ${String(postSurvey.openFeedback3).slice(0, 120)}`);
        }
        const preSurveyHtml = preLines.length
            ? preLines.map((line) => `<div class="admin-pre-log">${line}</div>`).join('')
            : '-';
        const newsVersionTag = getNewsVersionLabel(entry);
        const variantTag = entry.aiEnabled ? 'AI版' : '非AI';
        const serial = entry.id ?? (index + 1);
        tr.innerHTML = `
            <td>${serial}</td>
            <td class="admin-name-cell">
                <span class="admin-name-cell-content">
                    ${entry.name && entry.name !== 'AI' && entry.name !== 'NORMAL' ? entry.name : '-'} (${score})
                    <span class="admin-tag ${newsVersionTag === 'AI新闻' ? 'admin-tag-variant' : 'admin-tag-normal'}">${newsVersionTag}</span>
                    <span class="admin-tag ${entry.aiEnabled ? 'admin-tag-variant' : 'admin-tag-nonvariant'}">${variantTag}</span>
                    ${entry.name === 'AI' ? '<span class="admin-tag admin-tag-ai">AI</span>' : ''}
                    ${entry.name === 'NORMAL' ? '<span class="admin-tag admin-tag-normal">NORMAL</span>' : ''}
                </span>
            </td>
            <td>
                <div class="admin-metrics">
                    <div>${formatDuration(entry.durationMs)}</div>
                    <div>${formatTime(entry.timestamp)}</div>
                </div>
            </td>
            <td>
                <div class="admin-metrics">
                    <div>点击：${entry.clicks ?? 0}</div>
                    <div>距离：${entry.distance ?? 0}px</div>
                    <div>AI：${entry.aiInteractions ?? 0}</div>
                </div>
            </td>
            <td class="admin-choices">${choiceLines || '-'}</td>
            <td class="admin-pre-cell">${preSurveyHtml}</td>
        `;
        tbody.appendChild(tr);
    });
    renderSummary(stats);
}

function bindActions() {
    const refreshBtn = document.getElementById('admin-refresh');
    const exportBtn = document.getElementById('admin-export');
    const clearBtn = document.getElementById('admin-clear');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (!window.confirm('确认刷新数据吗？')) return;
            await refreshStats();
        });
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!window.confirm('确认导出数据吗？')) return;
            exportData();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (statsCache.some((row) => row.id)) {
                window.alert('线上数据暂不支持前端清空，请在数据库侧处理。');
                return;
            }
            if (!window.confirm('确认清空数据吗？此操作不可撤销。')) return;
            localStorage.removeItem('newsgame-stats');
            statsCache = [];
            renderRows();
            setDataStatus('local', '已清空本地数据，当前本地记录 0 条。');
        });
    }
}

function exportData() {
    const blob = new Blob([JSON.stringify(statsCache, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `newsgame-stats-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function refreshStats() {
    setDataStatus('loading', '正在读取云端数据...');
    const remote = await fetchRemoteStats();
    if (remote.ok) {
        statsCache = remote.list;
        renderRows();
        setDataStatus('cloud', `当前为云端数据，共 ${statsCache.length} 条。`);
        return;
    }
    const local = loadStats();
    statsCache = local;
    if (remote.error === 'missing_token') {
        setDataStatus('local', `未输入管理员 Token，当前显示本地数据，共 ${statsCache.length} 条。`);
    } else if (remote.error === 'unauthorized') {
        setDataStatus('local', `管理员 Token 无效，当前显示本地数据，共 ${statsCache.length} 条。`);
    } else if (remote.error === 'network') {
        setDataStatus('local', `云端不可达，当前显示本地数据，共 ${statsCache.length} 条。`);
    } else {
        setDataStatus('error', `读取云端失败（${remote.error || 'unknown'}），已回退本地，共 ${statsCache.length} 条。`);
    }
    if (!remote.ok && remote.error !== 'missing_token' && remote.error !== 'unauthorized') {
        window.alert('远端数据获取失败，已回退到本地数据。');
    }
    renderRows();
}

function bindTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');
    const actions = document.querySelector('.admin-actions');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.target;
            tabs.forEach(btn => btn.classList.remove('is-active'));
            sections.forEach(section => section.classList.remove('is-active'));
            document.querySelectorAll(`.admin-tab[data-target="${targetId}"]`)
                .forEach(btn => btn.classList.add('is-active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('is-active');
            if (actions) {
                actions.style.display = targetId === 'admin-data' ? 'flex' : 'none';
            }
            if (targetId === 'admin-flow') {
                renderAdminFlow();
            }
        });
    });
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function renderSummary(stats) {
    const now = new Date();
    let todayAi = 0;
    let todayNonAi = 0;
    let totalAi = 0;
    let totalNonAi = 0;
    let durationSum = 0;
    let durationCount = 0;
    let scoreSumAi = 0;
    let scoreSumNonAi = 0;
    let scoreCountAi = 0;
    let scoreCountNonAi = 0;
    const comboCounts = {
        ai_news__ai_game: 0,
        human_news__ai_game: 0,
        ai_news__nonai_game: 0,
        human_news__nonai_game: 0
    };

    stats.forEach((entry) => {
        const isAi = !!entry.aiEnabled;
        if (isAi) totalAi += 1;
        else totalNonAi += 1;

        const ts = entry.timestamp ? new Date(entry.timestamp) : null;
        if (ts && isSameDay(ts, now)) {
            if (isAi) todayAi += 1;
            else todayNonAi += 1;
        }

        if (typeof entry.durationMs === 'number' && !Number.isNaN(entry.durationMs)) {
            durationSum += entry.durationMs;
            durationCount += 1;
        }

        if (typeof entry.newsValue === 'number' && !Number.isNaN(entry.newsValue)) {
            if (isAi) {
                scoreSumAi += entry.newsValue;
                scoreCountAi += 1;
            } else {
                scoreSumNonAi += entry.newsValue;
                scoreCountNonAi += 1;
            }
        }

        const groupKey = getAssignmentGroupKey(entry);
        if (Object.prototype.hasOwnProperty.call(comboCounts, groupKey)) {
            comboCounts[groupKey] += 1;
        }
    });

    const avgSeconds = durationCount ? Math.round(durationSum / durationCount / 1000) : 0;
    const totalCount = totalAi + totalNonAi;
    const avgScoreAi = scoreCountAi ? Math.round(scoreSumAi / scoreCountAi) : 0;
    const avgScoreNonAi = scoreCountNonAi ? Math.round(scoreSumNonAi / scoreCountNonAi) : 0;
    const comboMax = Math.max(
        0,
        comboCounts.ai_news__ai_game,
        comboCounts.human_news__ai_game,
        comboCounts.ai_news__nonai_game,
        comboCounts.human_news__nonai_game
    );

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    setText('stats-today-ai', todayAi);
    setText('stats-today-nonai', todayNonAi);
    setText('stats-today-total', todayAi + todayNonAi);
    setText('stats-total-ai', totalAi);
    setText('stats-total-nonai', totalNonAi);
    setText('stats-total-total', totalAi + totalNonAi);
    setText('stats-avg-duration', avgSeconds);
    setText('stats-score-ai', avgScoreAi);
    setText('stats-score-nonai', avgScoreNonAi);
    setText('stats-combo-ai-ai', comboCounts.ai_news__ai_game);
    setText('stats-combo-human-ai', comboCounts.human_news__ai_game);
    setText('stats-combo-ai-nonai', comboCounts.ai_news__nonai_game);
    setText('stats-combo-human-nonai', comboCounts.human_news__nonai_game);

    const setBar = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        const percent = totalCount ? Math.round((value / totalCount) * 100) : 0;
        el.style.width = `${percent}%`;
    };

    setBar('chart-bar-ai', totalAi);
    setBar('chart-bar-nonai', totalNonAi);
    setBar('chart-bar-total', totalCount);
    setText('chart-value-ai', totalAi);
    setText('chart-value-nonai', totalNonAi);
    setText('chart-value-total', totalCount);

    const setComboBar = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        const percent = comboMax ? Math.round((value / comboMax) * 100) : 0;
        el.style.width = `${percent}%`;
    };

    setComboBar('chart-bar-combo-ai-ai', comboCounts.ai_news__ai_game);
    setComboBar('chart-bar-combo-human-ai', comboCounts.human_news__ai_game);
    setComboBar('chart-bar-combo-ai-nonai', comboCounts.ai_news__nonai_game);
    setComboBar('chart-bar-combo-human-nonai', comboCounts.human_news__nonai_game);
    setText('chart-value-combo-ai-ai', comboCounts.ai_news__ai_game);
    setText('chart-value-combo-human-ai', comboCounts.human_news__ai_game);
    setText('chart-value-combo-ai-nonai', comboCounts.ai_news__nonai_game);
    setText('chart-value-combo-human-nonai', comboCounts.human_news__nonai_game);

    const setScoreBar = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        const percent = Math.max(0, Math.min(100, Math.round((value / 100) * 100)));
        el.style.width = `${percent}%`;
    };

    setScoreBar('score-bar-ai', avgScoreAi);
    setScoreBar('score-bar-nonai', avgScoreNonAi);
    setText('score-value-ai', avgScoreAi);
    setText('score-value-nonai', avgScoreNonAi);
}

function renderAdminFlow() {
    const container = document.getElementById('admin-flowchart');
    if (!container) return;
    const overrides = loadOverrides();
    const mergedScenes = mergeScenes(baseScenes, overrides.scenes || {});
    const sceneIds = getSceneOrder(baseScenes, overrides.scenes || {});
    container.innerHTML = '';

    const adjacency = {};
    sceneIds.forEach((sceneId) => {
        const scene = mergedScenes[sceneId];
        const choices = Array.isArray(scene?.choices) ? scene.choices : [];
        const nextIds = [];
        choices.forEach((choice) => {
            if (!choice?.next) return;
            if (choice.next === 'ending_final') {
                if (mergedScenes.ending_good) nextIds.push('ending_good');
                if (mergedScenes.ending_bad) nextIds.push('ending_bad');
            } else {
                nextIds.push(choice.next);
            }
        });
        adjacency[sceneId] = Array.from(new Set(nextIds));
    });

    const levels = [];
    const visited = new Set();
    const queue = [];
    const startId = mergedScenes.intro ? 'intro' : sceneIds[0];
    if (startId) {
        queue.push({ id: startId, level: 0 });
        visited.add(startId);
        levels[0] = [startId];
    }
    while (queue.length) {
        const { id, level } = queue.shift();
        const children = adjacency[id] || [];
        children.forEach((childId) => {
            if (!childId || visited.has(childId)) return;
            visited.add(childId);
            const nextLevel = level + 1;
            if (!levels[nextLevel]) levels[nextLevel] = [];
            levels[nextLevel].push(childId);
            queue.push({ id: childId, level: nextLevel });
        });
    }
    sceneIds.forEach((sceneId) => {
        if (!visited.has(sceneId)) {
            const level = levels.length;
            levels[level] = [sceneId];
            visited.add(sceneId);
        }
    });

    const nodeWidth = 200;
    const nodeHeight = 54;
    const gapX = 60;
    const gapY = 80;
    const paddingX = 40;
    const paddingY = 40;
    const maxCount = Math.max(1, ...levels.map(level => level.length));
    const width = paddingX * 2 + maxCount * nodeWidth + (maxCount - 1) * gapX;
    const height = paddingY * 2 + levels.length * nodeHeight + (levels.length - 1) * gapY;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'flow-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrow.setAttribute('fill', '#0f172a');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const positions = {};
    levels.forEach((level, levelIndex) => {
        const y = paddingY + levelIndex * (nodeHeight + gapY);
        level.forEach((sceneId, index) => {
            const x = paddingX + index * (nodeWidth + gapX);
            positions[sceneId] = { x, y };
        });
    });

    Object.entries(adjacency).forEach(([fromId, children]) => {
        const from = positions[fromId];
        if (!from) return;
        children.forEach((childId) => {
            const to = positions[childId];
            if (!to) return;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', String(from.x + nodeWidth / 2));
            line.setAttribute('y1', String(from.y + nodeHeight));
            line.setAttribute('x2', String(to.x + nodeWidth / 2));
            line.setAttribute('y2', String(to.y));
            line.setAttribute('class', 'admin-flow-link');
            line.setAttribute('marker-end', 'url(#flow-arrow)');
            svg.appendChild(line);
        });
    });

    levels.forEach((level) => {
        level.forEach((sceneId) => {
            const scene = mergedScenes[sceneId];
            const pos = positions[sceneId];
            if (!scene || !pos) return;
            const title = getLocaleValue(scene.title, 'zh') || sceneId;
            const isEnding = !(Array.isArray(scene.choices) && scene.choices.length);
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', String(pos.x));
            rect.setAttribute('y', String(pos.y));
            rect.setAttribute('width', String(nodeWidth));
            rect.setAttribute('height', String(nodeHeight));
            rect.setAttribute('rx', '2');
            rect.setAttribute('class', `admin-flow-rect${isEnding ? ' is-ending' : ''}`);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(pos.x + nodeWidth / 2));
            text.setAttribute('y', String(pos.y + nodeHeight / 2 + 4));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'admin-flow-text');
            const label = title.length > 12 ? `${title.slice(0, 12)}…` : title;
            text.textContent = label;

            const fullTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            fullTitle.textContent = title;
            rect.appendChild(fullTitle);

            svg.appendChild(rect);
            svg.appendChild(text);
        });
    });

    container.appendChild(svg);
}

function getSceneOrder(baseScenes, overrideScenes = {}) {
    const baseIds = Object.keys(baseScenes || {});
    const extraIds = Object.keys(overrideScenes).filter((id) => !baseIds.includes(id));
    return [...baseIds, ...extraIds];
}

function getLocaleValue(value, lang) {
    if (value && typeof value === 'object') {
        return value[lang] || '';
    }
    if (typeof value === 'string') return value;
    return '';
}

function formatNewsValueDelta(effect) {
    const delta = effect?.newsValueDelta;
    if (typeof delta !== 'number' || Number.isNaN(delta)) return '0';
    if (delta > 0) return `+${delta}`;
    return String(delta);
}

function createAiRoleRow(roleLabel, roleId, value) {
    const row = document.createElement('div');
    row.className = 'admin-editor-role-row is-ai-role';
    row.dataset.roleId = roleId;
    row.innerHTML = `
        <div class="admin-editor-role-name">${roleLabel}</div>
        <textarea class="admin-editor-textarea" rows="3"></textarea>
    `;
    const textarea = row.querySelector('textarea');
    if (textarea) textarea.value = value || '';
    return row;
}

function initEditor() {
    const sceneSelect = document.getElementById('editor-scene-select');
    const choiceContainer = document.getElementById('editor-choices');
    const saveSceneBtn = document.getElementById('editor-save-scene');
    const resetSceneBtn = document.getElementById('editor-reset-scene');
    const saveFeedback = document.getElementById('editor-save-feedback');
    const saveOverlay = document.getElementById('admin-save-overlay');

    if (!sceneSelect || !choiceContainer || !saveSceneBtn || !resetSceneBtn) {
        return;
    }

    const applyEditorLanguage = () => {
        editorLang = 'zh';
        document.querySelectorAll('.admin-editor [data-lang]').forEach((node) => {
            node.classList.toggle('is-hidden', node.dataset.lang !== editorLang);
        });
    };

    const refreshSceneOptions = (selectedId) => {
        const overrides = loadOverrides();
        const mergedScenes = mergeScenes(baseScenes, overrides.scenes || {});
        const sceneIds = getSceneOrder(baseScenes, overrides.scenes || {});
        sceneSelect.innerHTML = '';
        sceneIds.forEach((id) => {
            const option = document.createElement('option');
            option.value = id;
            const scene = mergedScenes[id];
            option.textContent = getLocaleValue(scene?.title, 'zh') || id;
            sceneSelect.appendChild(option);
        });
        const finalId = selectedId && mergedScenes[selectedId] ? selectedId : sceneIds[0];
        if (finalId) {
            sceneSelect.value = finalId;
            loadSceneToEditor(finalId, mergedScenes);
            applyEditorLanguage(editorLang);
        }
        renderAdminFlow();
    };

    let currentSceneChoices = [];
    const loadSceneToEditor = (sceneId, mergedScenes) => {
        const overrides = loadOverrides();
        const scenes = mergedScenes || mergeScenes(baseScenes, overrides.scenes || {});
        const scene = scenes[sceneId];
        if (!scene) return;
        const titleZh = document.getElementById('editor-title-zh');
        const titleEn = document.getElementById('editor-title-en');
        const textZh = document.getElementById('editor-text-zh');
        const textEn = document.getElementById('editor-text-en');
        if (titleZh) titleZh.value = getLocaleValue(scene.title, 'zh');
        if (titleEn) titleEn.value = getLocaleValue(scene.title, 'en');
        if (textZh) textZh.value = getLocaleValue(scene.text, 'zh');
        if (textEn) textEn.value = getLocaleValue(scene.text, 'en');

        choiceContainer.innerHTML = '';
        currentSceneChoices = Array.isArray(scene.choices) ? scene.choices : [];
        currentSceneChoices.forEach((choice, index) => {
            const row = document.createElement('div');
            row.className = 'admin-editor-choice-row';
            row.dataset.choiceIndex = String(index);
            row.dataset.next = choice.next || '';
            const targetScene = scenes[choice.next];
            const targetTitle = targetScene ? getLocaleValue(targetScene.title, 'zh') || choice.next : (choice.next || '-');
            const deltaText = formatNewsValueDelta(choice.effect);
            row.innerHTML = `
                <div class="admin-editor-choice-label">选项 ${index + 1}</div>
                <input class="admin-editor-input choice-text-zh" type="text" data-lang="zh" />
                <div class="admin-editor-choice-meta">
                    <span class="admin-editor-choice-meta-item">顺序：${index + 1}</span>
                    <span class="admin-editor-choice-meta-item">通向页面：${targetTitle}</span>
                    <span class="admin-editor-choice-meta-item">新闻价值：${deltaText}</span>
                </div>
            `;
            const input = row.querySelector('.choice-text-zh');
            if (input) input.value = getLocaleValue(choice.text, 'zh');
            choiceContainer.appendChild(row);
        });
        applyEditorLanguage(editorLang);
    };

    sceneSelect.addEventListener('change', () => {
        loadSceneToEditor(sceneSelect.value);
    });

    saveSceneBtn.addEventListener('click', async () => {
        const sceneId = sceneSelect.value;
        if (!sceneId) return;
        if (saveOverlay) saveOverlay.classList.add('is-visible');
        document.body.classList.add('is-loading');
        saveSceneBtn.disabled = true;
        if (saveFeedback) saveFeedback.textContent = '';
        try {
            const sourceLang = editorLang;
            const targetLang = sourceLang === 'zh' ? 'en' : 'zh';
            const aiAvailable = await getAiAvailable();
            const overrides = loadOverrides();
            const titleZh = document.getElementById('editor-title-zh');
            const titleEn = document.getElementById('editor-title-en');
            const textZh = document.getElementById('editor-text-zh');
            const textEn = document.getElementById('editor-text-en');
            overrides.scenes = overrides.scenes || {};
            const titleZhValue = titleZh ? titleZh.value.trim() : '';
            const titleEnValue = titleEn ? titleEn.value.trim() : '';
            const textZhValue = textZh ? textZh.value.trim() : '';
            const textEnValue = textEn ? textEn.value.trim() : '';
            const sourceTitle = sourceLang === 'zh' ? titleZhValue : titleEnValue;
            const sourceText = sourceLang === 'zh' ? textZhValue : textEnValue;
            const translatedTitle = await translateText(sourceTitle, sourceLang, targetLang, aiAvailable);
            const translatedText = await translateText(sourceText, sourceLang, targetLang, aiAvailable);
            if (sourceLang === 'zh') {
                if (titleEn && translatedTitle !== titleEnValue) titleEn.value = translatedTitle;
                if (textEn && translatedText !== textEnValue) textEn.value = translatedText;
            } else {
                if (titleZh && translatedTitle !== titleZhValue) titleZh.value = translatedTitle;
                if (textZh && translatedText !== textZhValue) textZh.value = translatedText;
            }
            const choiceRows = Array.from(choiceContainer.querySelectorAll('.admin-editor-choice-row'));
            const choices = [];
            for (const row of choiceRows) {
                const index = parseInt(row.dataset.choiceIndex || '0', 10);
                const baseChoice = currentSceneChoices[index] || {};
                const zhValue = row.querySelector('.choice-text-zh')?.value.trim() || getLocaleValue(baseChoice.text, 'zh');
                const enValue = await translateText(zhValue, 'zh', 'en', aiAvailable);
                choices.push({
                    text: { zh: zhValue, en: enValue },
                    next: baseChoice.next || row.dataset.next || '',
                    effect: baseChoice.effect,
                    hint: baseChoice.hint,
                    tags: baseChoice.tags
                });
            }

            overrides.scenes[sceneId] = {
                id: sceneId,
                title: {
                    zh: sourceLang === 'zh' ? sourceTitle : translatedTitle,
                    en: sourceLang === 'zh' ? translatedTitle : sourceTitle
                },
                text: {
                    zh: sourceLang === 'zh' ? sourceText : translatedText,
                    en: sourceLang === 'zh' ? translatedText : sourceText
                },
                choices
            };
            saveOverrides(overrides);
            refreshSceneOptions(sceneId);
            renderAdminFlow();
            if (saveFeedback) {
                saveFeedback.textContent = '已成功保存';
                clearTimeout(saveFeedback._timer);
                saveFeedback._timer = setTimeout(() => {
                    saveFeedback.textContent = '';
                }, 1600);
            }
        } finally {
            saveSceneBtn.disabled = false;
            if (saveOverlay) saveOverlay.classList.remove('is-visible');
            document.body.classList.remove('is-loading');
        }
    });

    resetSceneBtn.addEventListener('click', () => {
        const sceneId = sceneSelect.value;
        if (!sceneId) return;
        const overrides = loadOverrides();
        if (overrides.scenes && overrides.scenes[sceneId]) {
            delete overrides.scenes[sceneId];
            if (!Object.keys(overrides.scenes).length) {
                delete overrides.scenes;
            }
            saveOverrides(overrides);
            refreshSceneOptions(sceneId);
            renderAdminFlow();
        }
    });

    refreshSceneOptions();
    applyEditorLanguage(editorLang);
}

async function initAiEditor() {
    const backgroundInput = document.getElementById('ai-background-zh');
    const backgroundSave = document.getElementById('ai-background-save');
    const backgroundFeedback = document.getElementById('ai-background-feedback');
    const roleContainer = document.getElementById('ai-role-backgrounds');
    const roleSave = document.getElementById('ai-role-save');
    const roleFeedback = document.getElementById('ai-role-feedback');
    const followupPromptInput = document.getElementById('ai-followup-prompt-zh');
    const interviewPromptInput = document.getElementById('ai-interview-prompt-zh');
    const promptsSave = document.getElementById('ai-prompts-save');
    const promptsFeedback = document.getElementById('ai-prompts-feedback');

    if (!backgroundInput || !backgroundSave || !roleContainer || !roleSave) return;

    const showFeedback = (el, text) => {
        if (!el) return;
        el.textContent = text;
        clearTimeout(el._timer);
        el._timer = setTimeout(() => {
            el.textContent = '';
        }, 1600);
    };

    const overrides = loadOverrides();
    if (followupPromptInput && interviewPromptInput) {
        const prompts = getAiPrompts();
        followupPromptInput.value = overrides.aiPrompts?.followup?.zh || prompts.followup.zh || '';
        interviewPromptInput.value = overrides.aiPrompts?.interview?.zh || prompts.interview.zh || '';
    }
    const baseBackground = await loadAiBackgroundDefault();
    const currentBackground = overrides.aiBackground?.zh || baseBackground?.zh || '';
    backgroundInput.value = currentBackground;

    const roleList = baseInterviewRoles;

    roleContainer.innerHTML = '';
    for (const role of roleList) {
        const roleId = role.id;
        const roleLabel = role.label?.zh || roleId;
        const overrideRole = overrides.interviewRoleBackgrounds?.[roleId];
        const baseRole = await loadRoleBackgroundDefault(roleId);
        const roleValue = overrideRole?.zh || baseRole?.zh || '';
        roleContainer.appendChild(createAiRoleRow(roleLabel, roleId, roleValue));
    }

    backgroundSave.addEventListener('click', async () => {
        backgroundSave.disabled = true;
        try {
            const aiAvailable = await getAiAvailable();
            const zhValue = backgroundInput.value.trim();
            const enValue = await translateText(zhValue, 'zh', 'en', aiAvailable);
            const next = loadOverrides();
            next.aiBackground = { zh: zhValue, en: enValue };
            saveOverrides(next);
            showFeedback(backgroundFeedback, '已保存');
        } finally {
            backgroundSave.disabled = false;
        }
    });

    roleSave.addEventListener('click', async () => {
        roleSave.disabled = true;
        try {
            const aiAvailable = await getAiAvailable();
            const rows = Array.from(roleContainer.querySelectorAll('.admin-editor-role-row'));
            const roleMap = {};
            for (const row of rows) {
                const roleId = row.dataset.roleId;
                const text = row.querySelector('textarea')?.value.trim() || '';
                const translated = await translateText(text, 'zh', 'en', aiAvailable);
                if (roleId) {
                    roleMap[roleId] = { zh: text, en: translated };
                }
            }
            const next = loadOverrides();
            next.interviewRoleBackgrounds = roleMap;
            saveOverrides(next);
            showFeedback(roleFeedback, '已保存');
        } finally {
            roleSave.disabled = false;
        }
    });

    if (promptsSave && followupPromptInput && interviewPromptInput) {
        promptsSave.addEventListener('click', async () => {
            promptsSave.disabled = true;
            try {
                const aiAvailable = await getAiAvailable();
                const followupZh = followupPromptInput.value.trim();
                const interviewZh = interviewPromptInput.value.trim();
                const followupEn = await translateText(followupZh, 'zh', 'en', aiAvailable);
                const interviewEn = await translateText(interviewZh, 'zh', 'en', aiAvailable);
                const next = loadOverrides();
                next.aiPrompts = {
                    followup: { zh: followupZh, en: followupEn },
                    interview: { zh: interviewZh, en: interviewEn }
                };
                saveOverrides(next);
                showFeedback(promptsFeedback, '已成功保存');
            } finally {
                promptsSave.disabled = false;
            }
        });
    }
}

refreshStats();
bindActions();
bindTabs();
initEditor();
initAiEditor();
const actions = document.querySelector('.admin-actions');
if (actions) actions.style.display = 'none';
bindConfigTransfer();
