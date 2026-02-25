import { textDB } from '../data/textDB.js';

/**
 * 多分支主线 + 汇合节点剧情结构
 */
export const scenes = {
    tutorial_intro: {
        id: 'tutorial_intro',
        title: { zh: '教学关：奇怪的谋杀？', en: 'Tutorial: A Strange Murder?' },
        text: textDB.tutorialIntro,
        choices: [
            {
                text: { zh: '先保护现场边界，再记录你亲眼可证的细节', en: 'Protect the scene boundary, then log only what you can verify firsthand' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '和围观者快速对话，筛出可复述的时间点', en: 'Do quick crowd interviews and extract reproducible timestamps' },
                next: 'tutorial_follow',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先跟着热帖节奏走，准备抢速度发第一条', en: 'Follow the viral thread first and rush for first publication' },
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
                text: { zh: '去物业盯监控导出，拿到可回放证据', en: 'Go to property management and wait for exportable CCTV evidence' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '回到目击者处做二次核问，压实描述边界', en: 'Run a second witness interview to tighten factual boundaries' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '直接把“疑似谋杀”送审，边发边改', en: 'File “suspected murder” now and patch it later' },
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
                text: { zh: '先去官方简报锁定硬信息，再回现场补证', en: 'Lock hard facts at the official briefing first, then return for field proof' },
                next: 'briefing',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先做社媒溯源，判断“爆炸视频”真假', en: 'Run social-source tracing first to test the “explosion clip”' },
                next: 'social_desk',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '沿撤离线快跑一圈，先抓真实影响面', en: 'Run the evacuation perimeter first to capture real impact' },
                next: 'field_probe',
                effect: { newsValueDelta: 1 }
            }
        ]
    },

    social_desk: {
        id: 'social_desk',
        title: { zh: '社媒溯源台', en: 'Social Source Desk' },
        text: textDB.socialDesk,
        choices: [
            {
                text: { zh: '做反向检索与帧级比对，先判定素材新旧', en: 'Run reverse search and frame-level comparisons to date the clip' },
                next: 'route_choice',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '联系平台信任与安全团队，请求溯源协助', en: 'Contact platform trust-and-safety for source-chain support' },
                next: 'briefing',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先写“疑似爆炸”快讯占位，再等待补证', en: 'Publish a provisional “suspected blast” brief before verification completes' },
                next: 'briefing',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    field_probe: {
        id: 'field_probe',
        title: { zh: '前线快查', en: 'Frontline Probe' },
        text: textDB.fieldProbe,
        choices: [
            {
                text: { zh: '跟随巡逻单元记录风向与火线推进坐标', en: 'Shadow a patrol unit and log wind shifts plus fireline coordinates' },
                next: 'route_choice',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '跟撤离巴士走一段，核实通知到达时间', en: 'Ride with evac transport and verify notice-delivery timing' },
                next: 'briefing',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先拍最震撼镜头做开场，细节之后再补', en: 'Capture the most dramatic visuals first and fill details later' },
                next: 'route_choice',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    briefing: {
        id: 'briefing',
        title: { zh: '官方简报与信息落差', en: 'Briefing and Gaps' },
        text: textDB.briefing,
        choices: [
            {
                text: { zh: '逐条核对可引用数据并标注更新时间', en: 'Verify each citable metric and tag update timestamps' },
                next: 'route_choice',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '把“已证实/待核实”分栏，准备双线采访', en: 'Split confirmed vs pending claims and plan two-track interviews' },
                next: 'route_choice',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先抓一句强势口号做标题方向', en: 'Anchor your angle on a strong slogan first' },
                next: 'route_choice',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    route_choice: {
        id: 'route_choice',
        title: { zh: '路线选择', en: 'Route Choice' },
        text: textDB.routeChoice,
        choices: [
            {
                text: { zh: '去避难所：看资源是否真的覆盖最脆弱人群', en: 'Go to the shelter: test whether resources reach the most vulnerable' },
                next: 'shelter',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '去医院：确认健康风险与分诊压力是否升级', en: 'Go to the hospital: confirm whether health risk and triage strain are escalating' },
                next: 'hospital',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '去物流点：查补给延误是否会改写撤离效率', en: 'Go to logistics: check if supply delays will reshape evacuation efficiency' },
                next: 'logistics',
                effect: { newsValueDelta: 1 }
            }
        ]
    },

    shelter: {
        id: 'shelter',
        title: { zh: '避难所的多重叙述', en: 'Shelter Narratives' },
        text: textDB.shelter,
        choices: [
            {
                text: { zh: '先核名册与床位表，确认“满员”是否真实', en: 'Cross-check rosters with bed sheets before accepting “full capacity”' },
                next: 'shelter_conflict',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '围绕婴幼儿与慢病人群，补齐服务缺口清单', en: 'Build a service-gap list focused on infants and chronic patients' },
                next: 'shelter_conflict',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先写人群情绪与冲突画面，事实细项之后补', en: 'Lead with emotional crowd conflict first, fill hard details later' },
                next: 'shelter_conflict',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    shelter_conflict: {
        id: 'shelter_conflict',
        title: { zh: '避难所：账本冲突', en: 'Shelter: Ledger Conflict' },
        text: textDB.shelterConflict,
        choices: [
            {
                text: { zh: '把登记表、物资清单和现场人数做三表对齐', en: 'Align roster, supply sheet, and headcount into one matrix' },
                next: 'data_room',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '提交“缺口清单”给热线并保留回复记录', en: 'Submit your shortage list to hotline and archive every reply' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '优先写单个家庭遭遇，先发人物故事版', en: 'Prioritize a single family profile and publish the human story first' },
                next: 'rumor_trace',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    hospital: {
        id: 'hospital',
        title: { zh: '医院里的风险提醒', en: 'Hospital Risk Notes' },
        text: textDB.hospital,
        choices: [
            {
                text: { zh: '调取分诊等待数据，对照 AQI 峰值时间', en: 'Pull triage wait data and compare it against AQI peaks' },
                next: 'hospital_triage',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '采访一线医生，拿到可署名的风险建议', en: 'Get on-record risk guidance from frontline doctors' },
                next: 'hospital_triage',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先发候诊区拥堵短视频，后续再补背景', en: 'Publish a waiting-room congestion clip first, add context later' },
                next: 'hospital_triage',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    hospital_triage: {
        id: 'hospital_triage',
        title: { zh: '医院：分诊压力', en: 'Hospital: Triage Pressure' },
        text: textDB.hospitalTriage,
        choices: [
            {
                text: { zh: '用“分诊时间线 + 人群分层”重建风险图', en: 'Reconstruct a risk map with triage timeline and group segmentation' },
                next: 'data_room',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '保留院方限制条款，发布谨慎版医疗提醒', en: 'Keep hospital limitations explicit and publish a cautious health advisory' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '以“医疗挤兑”定调并放大最极端个案', en: 'Frame the story as “medical collapse” and amplify extreme cases' },
                next: 'rumor_trace',
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
                text: { zh: '要到车队时间戳与改道记录，先跑一轮核对', en: 'Obtain convoy timestamps and detour logs for first-pass verification' },
                next: 'logistics_checkpoint',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '沿司机口述路线复盘，确认瓶颈是否可复现', en: 'Reconstruct routes from driver testimony and test bottleneck repeatability' },
                next: 'logistics_checkpoint',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '把“补给失联”作为结论先抛出', en: 'Publish “supplies missing in transit” as a lead conclusion first' },
                next: 'logistics_checkpoint',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    logistics_checkpoint: {
        id: 'logistics_checkpoint',
        title: { zh: '物流点：关键路口', en: 'Logistics: Chokepoint' },
        text: textDB.logisticsCheckpoint,
        choices: [
            {
                text: { zh: '把 GPS、路况、ETA 三条链闭环校验', en: 'Close the loop across GPS, road status, and ETA' },
                next: 'data_room',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '记录改道原因并标注“可验证/不可验证”', en: 'Record detour causes and label verifiable vs unverifiable claims' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '用“补给崩溃”做统一叙述，先推送警报', en: 'Unify the narrative as “supply collapse” and push an alert first' },
                next: 'rumor_trace',
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
                text: { zh: '建立“时间线 + 可信度分层”主表', en: 'Build a master sheet with timeline and confidence tiers' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先把口径冲突写成问题清单，带着问题去追问', en: 'Turn metric conflicts into a question list and chase answers' },
                next: 'press_pool',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '保留关键不确定项，先推进下一轮核实', en: 'Keep key uncertainties explicit and move to the next verification loop' },
                next: 'verification',
                effect: { newsValueDelta: 0 }
            }
        ]
    },

    press_pool: {
        id: 'press_pool',
        title: { zh: '联合采访池', en: 'Press Pool' },
        text: textDB.pressPool,
        choices: [
            {
                text: { zh: '追问“控制率分母、更新时间、口径变化”三连', en: 'Press on denominator, update time, and metric-definition changes' },
                next: 'official_response',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '争取官方给出“可更正窗口”与后续更新时间', en: 'Secure a correction window and scheduled update cadence' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '为保采访通道，主动弱化尖锐问题', en: 'Soften sharp questions to preserve access' },
                next: 'drafting',
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
                text: { zh: '做地理定位：建筑轮廓、风向、时间戳三重比对', en: 'Geolocate with roofline, wind, and timestamp triple checks' },
                next: 'osint_lab',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '顺着转发链找最早发布者与二次剪辑节点', en: 'Trace the repost chain to original uploader and re-edit points' },
                next: 'community_hearings',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先要官方回应，再决定是否继续追视频源', en: 'Get official response first, then decide how far to chase the clip source' },
                next: 'official_response',
                effect: { newsValueDelta: 1 }
            }
        ]
    },

    osint_lab: {
        id: 'osint_lab',
        title: { zh: '开源核查实验室', en: 'OSINT Lab' },
        text: textDB.osintLab,
        choices: [
            {
                text: { zh: '用历史街景与地形线索复原拍摄点', en: 'Reconstruct filming location from archived street views and terrain' },
                next: 'official_response',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '比对音频频谱，判断是否为二次拼接', en: 'Compare audio spectra to detect possible recomposition' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '把半成品结论先投给群聊试水', en: 'Leak preliminary findings to a chat group for reaction' },
                next: 'community_hearings',
                effect: { newsValueDelta: -1 }
            }
        ]
    },

    official_response: {
        id: 'official_response',
        title: { zh: '官方回应', en: 'Official Response' },
        text: textDB.officialResponse,
        choices: [
            {
                text: { zh: '逐句标注“已证实/待确认”后再引用', en: 'Annotate each quote as confirmed vs pending before citing' },
                next: 'verification',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '要求提供事件日志片段，补齐时间轴缺口', en: 'Request incident-log excerpts to patch timeline gaps' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '用“爆炸？”做强势标题先推送', en: 'Push a strong “Explosion?” headline first' },
                next: 'rapid_update',
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
                text: { zh: '按“亲历/转述/传闻”三层重排证言', en: 'Reorder testimony into firsthand, relayed, and rumor tiers' },
                next: 'verification',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '做目击时间矩阵，找可交叉的重叠段', en: 'Build a witness-time matrix and find cross-checkable overlaps' },
                next: 'verification',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先用最刺激情绪片段吸引点击', en: 'Lead with the most emotionally charged clip for clicks' },
                next: 'rapid_update',
                effect: { newsValueDelta: -1 }
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
                text: { zh: '等到独立来源到位再发主稿', en: 'Hold the main story until an independent source lands' },
                next: 'editorial_review',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先发“已证实核心 + 待核实侧栏”双轨版', en: 'Publish a dual-track version: verified core plus pending sidebar' },
                next: 'drafting',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '把复杂不确定性压成单一确定结论', en: 'Compress complex uncertainty into one certain conclusion' },
                next: 'rapid_update',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    rapid_update: {
        id: 'rapid_update',
        title: { zh: '快更压力线', en: 'Rapid Update Pressure' },
        text: textDB.rapidUpdate,
        choices: [
            {
                text: { zh: '改成“可修正”直播稿：每段带时间戳与来源', en: 'Switch to a correction-ready live draft with timestamped sourcing' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '暂停 10 分钟，回到证据链重排优先级', en: 'Pause for ten minutes and rebuild evidence priorities' },
                next: 'drafting',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '继续抢速度，争议留到发布后再处理', en: 'Keep racing on speed and defer disputes until after publication' },
                next: 'final_decision',
                effect: { newsValueDelta: -3 }
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
                text: { zh: '导语采用“已知/未知/下一步核实”三段式', en: 'Use a three-part lead: known, unknown, and next verification step' },
                next: 'editorial_review',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先给撤离与健康指引，再铺证据链', en: 'Lead with evacuation and health guidance, then present evidence chain' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先用“爆点”抓读者，再在后文加限定', en: 'Hook readers with a sensational lead, then add caveats later' },
                next: 'final_decision',
                effect: { newsValueDelta: -2 }
            }
        ]
    },

    editorial_review: {
        id: 'editorial_review',
        title: { zh: '编辑台复核', en: 'Editorial Review' },
        text: textDB.editorialReview,
        choices: [
            {
                text: { zh: '做法务与风险复核：每条关键句绑定来源', en: 'Run legal/risk checks and bind each key line to a source' },
                next: 'final_decision',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '做读者理解测试，修正最易误读段落', en: 'Run a reader-comprehension pass and fix high-misread sections' },
                next: 'final_decision',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '跳过复核，抢在竞品前 3 分钟上线', en: 'Skip review to publish three minutes ahead of competitors' },
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
                text: { zh: '发布完整稿 + 来源附录 + 更新承诺', en: 'Publish full story with source appendix and update commitment' },
                next: 'ending_final',
                effect: { newsValueDelta: 2 }
            },
            {
                text: { zh: '先发简讯版，同时挂出下一次更新时间', en: 'Publish a concise bulletin and pin the next update time' },
                next: 'ending_final',
                effect: { newsValueDelta: 1 }
            },
            {
                text: { zh: '先推标题预警，正文后补', en: 'Push a headline alert first and fill body details later' },
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
