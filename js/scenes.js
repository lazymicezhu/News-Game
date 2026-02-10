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
                text: { zh: '越过警戒线靠近倒地者', en: 'Slip past the tape toward the person' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '拉住围观者问他们看到了什么', en: 'Stop a bystander and ask what they saw' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 0 }
            },
            {
                text: { zh: '盯住热帖和传播路径', en: 'Track the viral post and its spread' },
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
                text: { zh: '直奔监控室等导出', en: 'Head for CCTV and wait for the export' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '贴近目击者追问细节', en: 'Press witnesses for specifics' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把“疑似谋杀”报给同事', en: 'Push “suspected murder” to the team' },
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
                text: { zh: '先把现场能确认的事实写进本子', en: 'Write down the confirmable facts on scene' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先打给官方简报口', en: 'Call the official briefing line first' },
                next: 'briefing',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先追踪传闻的传播路径', en: 'Chase the rumor’s spread first' },
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
                text: { zh: '把可核实的信息一条条记下', en: 'Log each verifiable detail' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把不确定的点圈出来', en: 'Circle the uncertainties' },
                next: 'route_choice',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把时间线拉出来', en: 'Sketch a timeline first' },
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
                text: { zh: '赶去避难所挤进人群', en: 'Head to the shelter and push through the crowd' },
                next: 'shelter',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '直奔医院急诊区', en: 'Go straight to the ER' },
                next: 'hospital',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '去物流点看补给车队', en: 'Go to the logistics hub for the convoys' },
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
                text: { zh: '盯着物资清单逐项核对', en: 'Audit the supply list item by item' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把证言的矛盾点写在一起', en: 'Lay conflicting testimonies side by side' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先记下人群情绪与氛围', en: 'Capture the crowd’s mood first' },
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
                text: { zh: '追着医生问风险细节', en: 'Press doctors for risk details' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '核对病例口径与统计方式', en: 'Verify case criteria and counting' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把现场细节还原下来', en: 'Reconstruct the scene in notes' },
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
                text: { zh: '追到车队节点逐一确认', en: 'Confirm each convoy node' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '记录官方调度的说法', en: 'Record the official dispatch line' },
                next: 'data_room',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '走访志愿者听民间反馈', en: 'Check grassroots feedback with volunteers' },
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
                text: { zh: '给每条来源贴上可信度', en: 'Tag each source with credibility' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把多源数据叠在一起', en: 'Layer the data from multiple sources' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '把证据缺口留在明处', en: 'Leave the evidence gaps visible' },
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
                text: { zh: '追查最早发布的账号', en: 'Trace the earliest account' },
                next: 'official_response',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '回到现场找目击者', en: 'Return to find eyewitnesses' },
                next: 'community_hearings',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把证据链搭起来', en: 'Build the evidence chain first' },
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
                text: { zh: '逐句记下官方措辞边界', en: 'Note the limits of official wording' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把媒体说法摊开对比', en: 'Lay media narratives side by side' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先按官方口径铺陈', en: 'Lead with the official line' },
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
                text: { zh: '标清谁是亲历谁是转述', en: 'Mark eyewitness vs. secondhand' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把可核实的细节拎出来', en: 'Pull out the verifiable details' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把情绪叙述摆在前面', en: 'Lead with the emotional accounts' },
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
                text: { zh: '把已核实的事实点亮', en: 'Highlight the verified facts' },
                next: 'drafting',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把不确定范围写清楚', en: 'Mark the uncertainty clearly' },
                next: 'drafting',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先把要点收拢成一页', en: 'Condense the key points first' },
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
                text: { zh: '把证据边界写在明处', en: 'State the evidence limits plainly' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '让情绪与事实并列出现', en: 'Balance emotion with facts' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先发一版短讯', en: 'Push a short update first' },
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
                text: { zh: '再核一次关键细节', en: 'Recheck the key details' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '补上不确定性的声明', en: 'Add the uncertainty notes' },
                next: 'ending_final',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先发出去再持续更新', en: 'Publish now, update as you go' },
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
