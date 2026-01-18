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

function renderRows() {
    const tbody = document.getElementById('admin-rows');
    if (!tbody) return;
    const stats = loadStats();
    tbody.innerHTML = '';

    stats.forEach((entry) => {
        const tr = document.createElement('tr');
        const choices = Array.isArray(entry.choices) ? entry.choices : [];
        const logs = Array.isArray(entry.aiLogs) ? entry.aiLogs : [];
        const logsByScene = logs.reduce((acc, log) => {
            const key = log.sceneId || '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(log);
            return acc;
        }, {});
        const choiceLines = choices.map((choice, index) => {
            const choiceText = typeof choice === 'string' ? choice : (choice.text || '-');
            const sceneId = typeof choice === 'string' ? '' : (choice.sceneId || '');
            const relatedLogs = sceneId ? (logsByScene[sceneId] || []) : [];
            const aiLines = relatedLogs.map((log) => {
                const type = log.type === 'interview' ? '采访' : '追问';
                const role = log.role ? `(${log.role})` : '';
                const q = log.question ? `Q: ${log.question}` : '';
                const a = log.response ? `A: ${log.response}` : '';
                return `<div class="admin-ai-log">${type}${role} ${q} ${a}</div>`;
            }).join('');
            return `
                <div class="admin-choice-row">
                    <div>${index + 1}. ${choiceText}</div>
                    ${aiLines}
                </div>
            `;
        }).join('');
        tr.innerHTML = `
            <td>${entry.name || '-'}</td>
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
    });
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

renderRows();
bindActions();
