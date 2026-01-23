import { textDB } from '../data/textDB.js';

/**
 * 线性场景数据（加州野火版）
 */
export const scenes = {
    intro: {
        id: 'intro',
        title: { zh: '序章：2025 加州野火蔓延', en: 'Prologue: 2025 California Wildfire Spreads' },
        image: 'arts/大纪元-加州野火1.jpg',
        text: textDB.intro,
        choices: [
            {
                text: { zh: '先梳理事件时间线', en: 'Outline the timeline first' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先确认信息来源', en: 'Verify sources first' },
                next: 'briefing',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先观察社交舆情', en: 'Scan social chatter first' },
                next: 'briefing',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    briefing: {
        id: 'briefing',
        title: { zh: '官方简报', en: 'Official Briefing' },
        text: textDB.briefing,
        choices: [
            {
                text: { zh: '记录核心数据与时间点', en: 'Log key numbers and timestamps' },
                next: 'field_route',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '补充撤离与安全提醒', en: 'Add evacuation and safety notes' },
                next: 'field_route',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先整理已有信息', en: 'Organize what we already have' },
                next: 'field_route',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    field_route: {
        id: 'field_route',
        title: { zh: '前线路线规划', en: 'Field Route Planning' },
        text: textDB.fieldRoute,
        choices: [
            {
                text: { zh: '优先去避难所', en: 'Prioritize the shelter' },
                next: 'shelter',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '优先去医院', en: 'Prioritize the hospital' },
                next: 'shelter',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先做远程核查', en: 'Start with remote verification' },
                next: 'shelter',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    shelter: {
        id: 'shelter',
        title: { zh: '避难所走访', en: 'Shelter Visit' },
        text: textDB.shelter,
        choices: [
            {
                text: { zh: '记录物资与需求变化', en: 'Record supplies and needs' },
                next: 'hospital',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '记录情绪与互助情况', en: 'Record emotions and mutual aid' },
                next: 'hospital',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先整理采访要点', en: 'Outline interview focus' },
                next: 'hospital',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    hospital: {
        id: 'hospital',
        title: { zh: '医院走访', en: 'Hospital Visit' },
        text: textDB.hospital,
        choices: [
            {
                text: { zh: '记录就诊趋势与风险', en: 'Record trends and risks' },
                next: 'logistics',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '补充防护建议', en: 'Add protection advice' },
                next: 'logistics',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先核对已有说法', en: 'Cross-check existing claims' },
                next: 'logistics',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    logistics: {
        id: 'logistics',
        title: { zh: '物资与物流', en: 'Supplies and Logistics' },
        text: textDB.logistics,
        choices: [
            {
                text: { zh: '记录补给进度', en: 'Record supply progress' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '确认短缺类型', en: 'Confirm shortage types' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '整理可用数据', en: 'Catalog available data' },
                next: 'data_room',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    data_room: {
        id: 'data_room',
        title: { zh: '数据台', en: 'Data Desk' },
        text: textDB.dataRoom,
        choices: [
            {
                text: { zh: '标注数据来源', en: 'Label data sources' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '整理地图与趋势', en: 'Organize maps and trends' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '快速生成图表', en: 'Generate quick charts' },
                next: 'rumor_trace',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    rumor_trace: {
        id: 'rumor_trace',
        title: { zh: '传闻追踪', en: 'Rumor Tracking' },
        text: textDB.rumorTrace,
        choices: [
            {
                text: { zh: '核对传播路径', en: 'Track spread path' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '核对视频来源', en: 'Verify video source' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '记录讨论焦点', en: 'Note discussion focus' },
                next: 'verification',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    verification: {
        id: 'verification',
        title: { zh: '交叉核实', en: 'Cross Verification' },
        text: textDB.verification,
        choices: [
            {
                text: { zh: '补充官方确认信息', en: 'Add official confirmations' },
                next: 'community_update',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '标注不确定性', en: 'Flag uncertainties' },
                next: 'community_update',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '暂存待核清单', en: 'Save open questions' },
                next: 'community_update',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    community_update: {
        id: 'community_update',
        title: { zh: '社区更新', en: 'Community Update' },
        text: textDB.communityUpdate,
        choices: [
            {
                text: { zh: '补充居民关切点', en: 'Add resident concerns' },
                next: 'drafting',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '平衡官方与民间信息', en: 'Balance official and community info' },
                next: 'drafting',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '总结关键信息', en: 'Summarize key points' },
                next: 'drafting',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    drafting: {
        id: 'drafting',
        title: { zh: '稿件整合', en: 'Draft Assembly' },
        text: textDB.drafting,
        choices: [
            {
                text: { zh: '强调核实与透明', en: 'Emphasize verification and transparency' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '平衡信息与可读性', en: 'Balance clarity and detail' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先整理结构框架', en: 'Outline the structure' },
                next: 'final_decision',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    final_decision: {
        id: 'final_decision',
        title: { zh: '发布前确认', en: 'Final Check' },
        text: textDB.finalDecision,
        choices: [
            {
                text: { zh: '再次核对关键事实', en: 'Recheck key facts' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '完善风险提示', en: 'Refine risk notes' },
                next: 'ending_final',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '确认发布内容', en: 'Confirm publish version' },
                next: 'ending_final',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    ending_good: {
        id: 'ending_good',
        title: { zh: '结局：高价值报道', en: 'Ending: High-value Reporting' },
        text: textDB.endingGood,
        choices: []
    },

    ending_bad: {
        id: 'ending_bad',
        title: { zh: '结局：价值不足', en: 'Ending: Value Falls Short' },
        text: textDB.endingBad,
        choices: []
    }
};
