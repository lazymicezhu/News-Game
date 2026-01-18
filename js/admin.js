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
            <td>${formatDuration(entry.durationMs)}</td>
            <td>${entry.clicks ?? 0}</td>
            <td>${entry.distance ?? 0}</td>
            <td>${entry.aiInteractions ?? 0}</td>
            <td class="admin-choices">${choiceLines || '-'}</td>
            <td>${formatTime(entry.timestamp)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function bindActions() {
    const refreshBtn = document.getElementById('admin-refresh');
    const clearBtn = document.getElementById('admin-clear');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', renderRows);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            localStorage.removeItem('newsgame-stats');
            renderRows();
        });
    }
}

renderRows();
bindActions();
