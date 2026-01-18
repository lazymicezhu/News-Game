let cachedConfig = null;

async function loadConfig() {
    if (cachedConfig) return cachedConfig;
    const response = await fetch('config/ai.json', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('AI_CONFIG_LOAD_FAILED');
    }
    const config = await response.json();
    cachedConfig = {
        baseUrl: (config.baseUrl || '').trim(),
        apiKey: (config.apiKey || '').trim(),
        model: (config.model || 'gpt-4o-mini').trim()
    };
    return cachedConfig;
}

function buildEndpoint(baseUrl) {
    const normalized = baseUrl.replace(/\/+$/, '');
    const withVersion = normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
    return `${withVersion}/chat/completions`;
}

export async function streamChat({ messages, onToken, signal }) {
    const config = await loadConfig();
    if (!config.baseUrl || !config.apiKey) {
        throw new Error('AI_CONFIG_MISSING');
    }

    const response = await fetch(buildEndpoint(config.baseUrl), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            stream: true
        }),
        signal
    });

    if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => '');
        const error = new Error('AI_RESPONSE_ERROR');
        error.detail = detail;
        throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.replace(/^data:\s*/, '');
            if (payload === '[DONE]') return;
            try {
                const data = JSON.parse(payload);
                const token = data?.choices?.[0]?.delta?.content;
                if (token) onToken(token);
            } catch {
                // Ignore malformed chunks.
            }
        }
    }
}

export async function isAiConfigured() {
    try {
        const config = await loadConfig();
        const key = (config.apiKey || '').trim();
        if (!config.baseUrl) return false;
        if (!key || key === 'REPLACE_WITH_YOUR_KEY') return false;
        return true;
    } catch {
        return false;
    }
}
