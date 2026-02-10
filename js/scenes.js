import { textDB } from '../data/textDB.js';

/**
 * 线性主线 + 分支汇合的剧情结构
 */
export const scenes = {
    tutorial_intro: {
        id: 'tutorial_intro',
        title: { zh: '教学关：奇怪的谋杀？', en: 'Tutorial: A Strange Murder?' },
        text: textDB.tutorialIntro,
        choices: [
            {
                text: { zh: '走近一点看看发生了什么', en: 'Step closer to see what happened' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '询问周围的路人', en: 'Ask nearby bystanders' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 0 }
            },
            {
                text: { zh: '先把热帖截个图发给编辑', en: 'Screenshot the viral post for the editor' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: -2 }
            }
        ]
    },
    tutorial_follow: {
        id: 'tutorial_follow',
        title: { zh: '教学关：核实路线', en: 'Tutorial: Verification Route' },
        text: textDB.tutorialFollow,
        choices: [
            {
                text: { zh: '先去找监控室', en: 'Go to the CCTV room first' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先追问目击者细节', en: 'Press witnesses for details first' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把“疑似谋杀”传给同事', en: 'Send “suspected murder” to the team' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: -2 }
            }
        ]
    },
    tutorial_resolution: {
        id: 'tutorial_resolution',
        title: { zh: '教学关：误会澄清', en: 'Tutorial: Misunderstanding Cleared' },
        text: textDB.tutorialResolution,
        choices: [
            {
                text: { zh: '进入正式报道', en: 'Proceed to the main report' },
                next: 'intro',
                effect: { newsValueDelta: 1 }
            }
        ]
    },
    tutorial_ending: {
        id: 'tutorial_ending',
        title: { zh: '教学关：结案', en: 'Tutorial: Case Closed' },
        text: textDB.tutorialEnding,
        choices: [
            {
                text: { zh: '进入正式报道', en: 'Proceed to the main report' },
                next: 'intro',
                effect: { newsValueDelta: 1 }
            }
        ]
    },
    intro: {
        id: 'intro',
        title: { zh: '序章：不确定的第一小时', en: 'Prologue: The First Uncertain Hour' },
        image: 'arts/大纪元-加州野火1-low.jpg',
        text: textDB.intro,
        choices: [
            {
                text: { zh: '先建立事实清单', en: 'Build a fact list first' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先锁定权威来源', en: 'Prioritize authoritative sources' },
                next: 'briefing',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先跟踪传播路径', en: 'Track the spread path first' },
                next: 'briefing',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    briefing: {
        id: 'briefing',
        title: { zh: '官方简报与信息落差', en: 'Briefing and Gaps' },
        text: textDB.briefing,
        choices: [
            {
                text: { zh: '记录可核实事实', en: 'Log verifiable facts' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '标注待确认要点', en: 'Flag items to verify' },
                next: 'route_choice',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先整理时间线', en: 'Draft a timeline first' },
                next: 'route_choice',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    route_choice: {
        id: 'route_choice',
        title: { zh: '路线选择', en: 'Route Choice' },
        text: textDB.routeChoice,
        choices: [
            {
                text: { zh: '先去避难所', en: 'Go to the shelter first' },
                next: 'shelter',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先去医院', en: 'Go to the hospital first' },
                next: 'hospital',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先去物流点', en: 'Go to the logistics hub first' },
                next: 'logistics',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    shelter: {
        id: 'shelter',
        title: { zh: '避难所的多重叙述', en: 'Shelter Narratives' },
        text: textDB.shelter,
        choices: [
            {
                text: { zh: '核对物资流向', en: 'Verify supply distribution' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '记录不同证言差异', en: 'Log differences across testimonies' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先写情绪速记', en: 'Draft an emotional snapshot' },
                next: 'data_room',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    hospital: {
        id: 'hospital',
        title: { zh: '医院里的风险提醒', en: 'Hospital Risk Notes' },
        text: textDB.hospital,
        choices: [
            {
                text: { zh: '补充健康风险信息', en: 'Add health risk details' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '核对统计口径', en: 'Verify reporting criteria' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先整理现场描述', en: 'Organize on-site descriptions' },
                next: 'data_room',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    logistics: {
        id: 'logistics',
        title: { zh: '物资调度与质疑', en: 'Supplies and Doubts' },
        text: textDB.logistics,
        choices: [
            {
                text: { zh: '验证供应链节点', en: 'Verify supply chain nodes' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '记录官方调度', en: 'Record official dispatch info' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '比对民间反馈', en: 'Compare grassroots feedback' },
                next: 'data_room',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    data_room: {
        id: 'data_room',
        title: { zh: '数据整合', en: 'Data Consolidation' },
        text: textDB.dataRoom,
        evaluation: textDB.evaluationDataRoom,
        choices: [
            {
                text: { zh: '标注来源可信度', en: 'Label source credibility' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '整合多源数据', en: 'Merge multi-source data' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '暂留证据缺口', en: 'Leave evidence gaps open' },
                next: 'rumor_trace',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    rumor_trace: {
        id: 'rumor_trace',
        title: { zh: '传闻追踪', en: 'Rumor Trace' },
        text: textDB.rumorTrace,
        media: [
            { type: 'image', src: 'arts/大纪元-加州野火1-low.jpg', alt: { zh: '现场截图', en: 'Field snapshot' } },
            { type: 'placeholder', label: { zh: '疑似爆炸视频片段（来源待核实）', en: 'Suspected blast clip (source unverified)' } }
        ],
        choices: [
            {
                text: { zh: '追踪原始发布者', en: 'Trace the original poster' },
                next: 'official_response',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '寻找现场证言', en: 'Seek on-site testimony' },
                next: 'community_hearings',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先搭建证据链', en: 'Build an evidence chain first' },
                next: 'verification',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    official_response: {
        id: 'official_response',
        title: { zh: '官方回应', en: 'Official Response' },
        text: textDB.officialResponse,
        choices: [
            {
                text: { zh: '记录官方措辞边界', en: 'Record official wording limits' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '对比媒体说法', en: 'Compare media narratives' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先保留官方立场', en: 'Hold the official stance' },
                next: 'verification',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    community_hearings: {
        id: 'community_hearings',
        title: { zh: '社区证言', en: 'Community Testimony' },
        text: textDB.communityHearings,
        choices: [
            {
                text: { zh: '标注证言层级', en: 'Label testimony levels' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '整理可核实细节', en: 'Extract verifiable details' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先呈现情绪叙述', en: 'Present emotional accounts first' },
                next: 'verification',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    verification: {
        id: 'verification',
        title: { zh: '交叉核实', en: 'Cross Verification' },
        text: textDB.verification,
        evaluation: textDB.evaluationVerification,
        choices: [
            {
                text: { zh: '明确已核实事实', en: 'Clarify verified facts' },
                next: 'drafting',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '标注不确定范围', en: 'Mark uncertainty ranges' },
                next: 'drafting',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先汇总要点', en: 'Summarize key points first' },
                next: 'drafting',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    drafting: {
        id: 'drafting',
        title: { zh: '稿件结构', en: 'Draft Structure' },
        text: textDB.drafting,
        evaluation: textDB.evaluationDrafting,
        choices: [
            {
                text: { zh: '透明标注证据边界', en: 'Be transparent about evidence limits' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '平衡情绪与事实', en: 'Balance emotion and facts' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先发布简版', en: 'Publish a brief version first' },
                next: 'final_decision',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    final_decision: {
        id: 'final_decision',
        title: { zh: '发布前抉择', en: 'Pre-Publish Decision' },
        text: textDB.finalDecision,
        choices: [
            {
                text: { zh: '再次核实关键点', en: 'Recheck key facts' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '补足不确定声明', en: 'Add uncertainty notes' },
                next: 'ending_final',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先发布再更新', en: 'Publish now and update later' },
                next: 'ending_final',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    ending_good: {
        id: 'ending_good',
        title: { zh: '结局：可信与有用', en: 'Ending: Credible and Useful' },
        text: textDB.endingGood,
        choices: []
    },

    ending_bad: {
        id: 'ending_bad',
        title: { zh: '结局：可信度不足', en: 'Ending: Credibility Falls Short' },
        text: textDB.endingBad,
        choices: []
    }
};
