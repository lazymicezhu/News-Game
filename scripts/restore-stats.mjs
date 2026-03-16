import fs from 'node:fs/promises';

const file = process.argv[2] || './数据/newsgame-stats-2026-03-10T12-26-37-436Z.json';
const endpoint = 'https://newsgame-egxdvooreq.cn-hangzhou.fcapp.run/responses';

const raw = await fs.readFile(file, 'utf8');
const rows = JSON.parse(raw);

if (!Array.isArray(rows)) {
  throw new Error('JSON 顶层不是数组');
}

let ok = 0;
let fail = 0;

for (const r of rows) {
  const payload = {
    name: r.name || '',
    aiEnabled: !!r.aiEnabled,
    clicks: r.clicks || 0,
    distance: r.distance || 0,
    aiInteractions: r.aiInteractions || 0,
    aiLogs: Array.isArray(r.aiLogs) ? r.aiLogs : [],
    clickPoints: Array.isArray(r.clickPoints) ? r.clickPoints : [],
    nonAiLogs: Array.isArray(r.nonAiLogs) ? r.nonAiLogs : [],
    choices: Array.isArray(r.choices) ? r.choices : [],
    newsValue: typeof r.newsValue === 'number' ? r.newsValue : 60,
    wildfireFamiliarity: r.wildfireFamiliarity || '',
    preSurvey: r.preSurvey || {},
    postSurvey: r.postSurvey || {},
    readingAssignment: r.readingAssignment || null,
    rewardInfo: r.rewardInfo || null,
    studyVariant: r.studyVariant || 'p1',
    durationMs: r.durationMs || 0,
    timestamp: r.timestamp || Date.now()
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) ok += 1;
    else {
      fail += 1;
      console.error(`POST failed: ${res.status}`);
    }
  } catch (err) {
    fail += 1;
    console.error('POST error:', err?.message || err);
  }
}

console.log(JSON.stringify({ file, total: rows.length, ok, fail }, null, 2));
