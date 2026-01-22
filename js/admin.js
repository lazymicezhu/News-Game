import { scenes as baseScenes } from './scenes.js';
import { interviewRoles as baseInterviewRoles } from '../data/interviewRoles.js';
import { streamChat, isAiConfigured } from './aiClient.js';

const OVERRIDES_STORAGE_KEY = 'newsgame-overrides';
let editorLang = 'zh';
let aiAvailablePromise = null;
const aiBackgroundCache = { base: null, roles: new Map() };

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

function loadStats() {
    try {
        return JSON.parse(localStorage.getItem('newsgame-stats') || '[]');
    } catch {
        return [];
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

function renderRows() {
    const tbody = document.getElementById('admin-rows');
    if (!tbody) return;
    const stats = loadStats();
    tbody.innerHTML = '';

    stats.forEach((entry, index) => {
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
        tr.innerHTML = `
            <td class="admin-name-cell">
                <span class="admin-name-cell-content">
                    ${entry.name && entry.name !== 'AI' && entry.name !== 'NORMAL' ? entry.name : '-'}
                    ${entry.name === 'AI' ? '<span class="admin-tag admin-tag-ai">AI</span>' : ''}
                    ${entry.name === 'NORMAL' ? '<span class="admin-tag admin-tag-normal">NORMAL</span>' : ''}
                </span>
            </td>
            <td>${entry.aiEnabled ? '是' : '否'}</td>
            <td>${formatDuration(entry.durationMs)}</td>
            <td>${entry.clicks ?? 0}</td>
            <td>${entry.distance ?? 0}</td>
            <td>${entry.aiInteractions ?? 0}</td>
            <td class="admin-choices">${choiceLines || '-'}</td>
            <td>
                <div class="admin-heatmap-cell">
                    <button class="btn btn-secondary admin-heatmap-btn" data-heatmap="1">查看热图</button>
                    <div class="admin-heatmap-tooltip">
                        <canvas width="360" height="202"></canvas>
                        <div class="admin-heatmap-empty">暂无点击数据</div>
                    </div>
                </div>
            </td>
            <td>
                <button class="btn btn-secondary admin-delete-btn" data-index="${index}" aria-label="删除">×</button>
            </td>
            <td>${formatTime(entry.timestamp)}</td>
        `;
        tbody.appendChild(tr);

        const btn = tr.querySelector('.admin-heatmap-btn');
        const tooltip = tr.querySelector('.admin-heatmap-tooltip');
        if (btn && tooltip) {
            const showTooltip = (event) => {
                renderRowHeatmap(entry, tooltip);
                positionTooltip(event, tooltip);
                tooltip.classList.add('is-visible');
            };
            btn.addEventListener('mouseenter', showTooltip);
            btn.addEventListener('mousemove', (event) => {
                if (tooltip.classList.contains('is-visible')) {
                    positionTooltip(event, tooltip);
                }
            });
            btn.addEventListener('mouseleave', () => {
                tooltip.classList.remove('is-visible');
            });
            tooltip.addEventListener('mouseleave', () => {
                tooltip.classList.remove('is-visible');
            });
        }

        const deleteBtn = tr.querySelector('.admin-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const index = parseInt(deleteBtn.dataset.index, 10);
                if (Number.isNaN(index)) return;
                const list = loadStats();
                list.splice(index, 1);
                saveStats(list);
                renderRows();
            });
        }
    });
    renderSummary(stats);
}

function drawHeatPoint(ctx, x, y, radius) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function renderRowHeatmap(entry, tooltip) {
    const canvas = tooltip.querySelector('canvas');
    const empty = tooltip.querySelector('.admin-heatmap-empty');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const points = Array.isArray(entry.clickPoints) ? entry.clickPoints : [];
    const background = entry.pageSnapshot || entry.sceneImage || '';

    if (!points.length) {
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    const drawPoints = () => {
        const radius = 18;
        points.forEach((pt) => {
            const x = pt.x * canvas.width;
            const y = pt.y * canvas.height;
            drawHeatPoint(ctx, x, y, radius);
        });
    };

    if (background) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            drawPoints();
        };
        img.onerror = () => {
            drawPoints();
        };
        img.src = background;
    } else {
        drawPoints();
    }
}

function positionTooltip(event, tooltip) {
    const padding = 12;
    const width = tooltip.offsetWidth || 360;
    const height = tooltip.offsetHeight || 220;
    let x = event.clientX + padding;
    let y = event.clientY + padding;

    if (x + width > window.innerWidth) {
        x = event.clientX - width - padding;
    }
    if (y + height > window.innerHeight) {
        y = event.clientY - height - padding;
    }
    tooltip.style.left = `${Math.max(padding, x)}px`;
    tooltip.style.top = `${Math.max(padding, y)}px`;
}

function bindActions() {
    const refreshBtn = document.getElementById('admin-refresh');
    const exportBtn = document.getElementById('admin-export');
    const clearBtn = document.getElementById('admin-clear');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', renderRows);
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            localStorage.removeItem('newsgame-stats');
            renderRows();
        });
    }
}

function exportData() {
    const data = loadStats();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
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

function bindTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.target;
            tabs.forEach(btn => btn.classList.remove('is-active'));
            sections.forEach(section => section.classList.remove('is-active'));
            document.querySelectorAll(`.admin-tab[data-target="${targetId}"]`)
                .forEach(btn => btn.classList.add('is-active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('is-active');
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
    });

    const avgSeconds = durationCount ? Math.round(durationSum / durationCount / 1000) : 0;
    const totalCount = totalAi + totalNonAi;

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
        adjacency[sceneId] = choices.map(choice => choice.next).filter(Boolean);
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
            row.innerHTML = `
                <div class="admin-editor-choice-label">选项 ${index + 1}</div>
                <input class="admin-editor-input choice-text-zh" type="text" data-lang="zh" />
                <div class="admin-editor-choice-label">通向页面：</div>
                <div class="admin-editor-choice-target">${targetTitle}</div>
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
}

renderRows();
bindActions();
bindTabs();
initEditor();
initAiEditor();
