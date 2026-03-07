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
                text: { zh: '先蹲下看清地上的人，再问旁边的人刚才发生了什么', en: 'Protect the scene boundary, then log only what you can verify firsthand' },
                next: 'tutorial_follow_wakeup',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先挨个问围观者，记下他们说的时间和方向', en: 'Do quick crowd interviews and extract reproducible timestamps' },
                next: 'tutorial_follow_witness',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先跟着手机热帖的说法走，马上发一条快讯', en: 'Follow the viral thread first and rush for first publication' },
                next: 'tutorial_follow_report',
                effect: { newsValueDelta: -2 }
            }
        ]
    },
    tutorial_follow_wakeup: {
        id: 'tutorial_follow_wakeup',
        title: { zh: '教学关：核实路线', en: 'Tutorial: Verification Route' },
        text: textDB.tutorialFollowWakeup,
        choices: [
            {
                text: { zh: '寻找物业查询监控，试图找到人倒下的时间', en: 'Check property CCTV and lock the collapse timeline' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '询问目击者发生了什么', en: 'Question witnesses and compare accounts' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '通知舆论控制办公室，先封控所有相关视频和言论', en: 'Escalate for immediate content control before verification' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: -2 }
            }
        ]
    },
    tutorial_follow_witness: {
        id: 'tutorial_follow_witness',
        title: { zh: '教学关：核实路线', en: 'Tutorial: Verification Route' },
        text: textDB.tutorialFollowWitness,
        choices: [
            {
                text: { zh: '寻找物业查询监控，试图找到人倒下的时间', en: 'Check property CCTV and lock the collapse timeline' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '继续询问目击者，把细节问到一致', en: 'Continue interviews and align witness details' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '通知舆论控制办公室，先封控所有相关视频和言论', en: 'Escalate for immediate content control before verification' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: -2 }
            }
        ]
    },
    tutorial_follow_report: {
        id: 'tutorial_follow_report',
        title: { zh: '教学关：核实路线', en: 'Tutorial: Verification Route' },
        text: textDB.tutorialFollowReport,
        choices: [
            {
                text: { zh: '寻找物业查询监控，试图找到人倒下的时间', en: 'Check property CCTV and lock the collapse timeline' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '询问目击者发生了什么', en: 'Question witnesses and compare accounts' },
                next: 'tutorial_resolution',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '通知舆论控制办公室，先封控所有相关视频和言论', en: 'Escalate for immediate content control before verification' },
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
                text: { zh: '走出巷口，去真正的火场', en: 'Proceed to the main report' },
                next: 'intro',
                effect: { newsValueDelta: 3 }
            }
        ]
    },
    tutorial_ending: {
        id: 'tutorial_ending',
        title: { zh: '教学关：结案', en: 'Tutorial: Case Closed' },
        text: textDB.tutorialEnding,
        choices: [
            {
                text: { zh: '离开巷口，赶往山火现场', en: 'Proceed to the main report' },
                next: 'intro',
                effect: { newsValueDelta: 3 }
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
                text: { zh: '先去简报现场，听完再回火线', en: 'Lock hard facts at the official briefing first, then return for field proof' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先去找那条爆炸视频最早是谁发的', en: 'Run social-source tracing first to test the “explosion clip”' },
                next: 'social_desk',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先沿撤离路线一路往前看', en: 'Run the evacuation perimeter first to capture real impact' },
                next: 'field_probe',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先去县应急中心门口守消息', en: 'Call county emergency desk and utility grid first to verify outage-and-alert coverage' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    social_desk: {
        id: 'social_desk',
        title: { zh: '社媒溯源台', en: 'Social Source Desk' },
        text: textDB.socialDesk,
        choices: [
            {
                text: { zh: '去视频评论区找最早发帖的人', en: 'Run reverse search and frame-level comparisons to date the clip' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去平台申诉窗口问这条视频从哪来', en: 'Contact platform trust-and-safety for source-chain support' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先照着传闻写一条短消息发出去', en: 'Publish a provisional “suspected blast” brief before verification completes' },
                next: 'briefing',
                effect: { newsValueDelta: -2 }
            },
            {
                text: { zh: '去联系上传者朋友，试着拿到原视频', en: 'Contact the original upload chain and request uncompressed footage plus capture time' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    field_probe: {
        id: 'field_probe',
        title: { zh: '前线快查', en: 'Frontline Probe' },
        text: textDB.fieldProbe,
        choices: [
            {
                text: { zh: '跟着巡逻车往山脚再走一段', en: 'Shadow a patrol unit and log wind shifts plus fireline coordinates' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '跟着撤离大巴去下一个集合点', en: 'Ride with evac transport and verify notice-delivery timing' },
                next: 'briefing',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '停在路边先拍最吓人的画面', en: 'Capture the most dramatic visuals first and fill details later' },
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
                text: { zh: '站在白板前一条条抄下刚更新的数字', en: 'Verify each citable metric and tag update timestamps' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '离开会场去找居民，把两边说法放一起看', en: 'Split confirmed vs pending claims and plan two-track interviews' },
                next: 'route_choice',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '抓一句最吓人的话当标题先写', en: 'Anchor your angle on a strong slogan first' },
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
                text: { zh: '去避难所，看看大家今晚怎么过', en: 'Go to the shelter: test whether resources reach the most vulnerable' },
                next: 'shelter',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去医院，看看门口排队到底有多长', en: 'Go to the hospital: confirm whether health risk and triage strain are escalating' },
                next: 'hospital',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去物资点，看车队是不是堵住了', en: 'Go to logistics: check if supply delays will reshape evacuation efficiency' },
                next: 'logistics',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去记者提问区，听别人都在追问什么', en: 'Go to the press pool first and lock the must-ask question set for the next cycle' },
                next: 'press_pool',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    shelter: {
        id: 'shelter',
        title: { zh: '避难所的多重叙述', en: 'Shelter Narratives' },
        text: textDB.shelter,
        choices: [
            {
                text: { zh: '去登记台翻名册，看看床位到底够不够', en: 'Cross-check rosters with bed sheets before accepting “full capacity”' },
                next: 'shelter_conflict',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去临时帐篷问带孩子和老人来的家庭', en: 'Build a service-gap list focused on infants and chronic patients' },
                next: 'shelter_conflict',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先拍吵起来的人群，马上写一段发出去', en: 'Lead with emotional crowd conflict first, fill hard details later' },
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
                text: { zh: '把名册、物资单和现场人数放在一起慢慢对', en: 'Align roster, supply sheet, and headcount into one matrix' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把缺的东西打电话报上去，并记下回话', en: 'Submit your shortage list to hotline and archive every reply' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先跟着一个家庭走一圈，写他们这一晚', en: 'Prioritize a single family profile and publish the human story first' },
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
                text: { zh: '去问护士每一段时间等了多久', en: 'Pull triage wait data and compare it against AQI peaks' },
                next: 'hospital_triage',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去找值班医生，当面问要怎么防护', en: 'Get on-record risk guidance from frontline doctors' },
                next: 'hospital_triage',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先拍候诊区最挤的时候，先发再补充', en: 'Publish a waiting-room congestion clip first, add context later' },
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
                text: { zh: '把“谁先来、谁等最久”按时间排成一行', en: 'Reconstruct a risk map with triage timeline and group segmentation' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先发一条温和提醒，告诉大家先怎么做', en: 'Keep hospital limitations explicit and publish a cautious health advisory' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '挑最严重的一例，写成“医院快撑不住”', en: 'Frame the story as “medical collapse” and amplify extreme cases' },
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
                text: { zh: '去找车队负责人，把出发和到达时间抄下来', en: 'Obtain convoy timestamps and detour logs for first-pass verification' },
                next: 'logistics_checkpoint',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '跟一位司机重走一遍路线', en: 'Reconstruct routes from driver testimony and test bottleneck repeatability' },
                next: 'logistics_checkpoint',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先写“物资不见了”，把消息顶到最前', en: 'Publish “supplies missing in transit” as a lead conclusion first' },
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
                text: { zh: '把司机手表时间、路牌和到站时间一个个对', en: 'Close the loop across GPS, road status, and ETA' },
                next: 'data_room',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把每次绕路原因写下来，能确认的先圈出来', en: 'Record detour causes and label verifiable vs unverifiable claims' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先发“补给崩了”的提醒消息', en: 'Unify the narrative as “supply collapse” and push an alert first' },
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
                text: { zh: '把今晚发生的事按时间一格一格排好', en: 'Build a master sheet with timeline and confidence tiers' },
                next: 'rumor_trace',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先把对不上的地方写成三问，拿去当面问人', en: 'Turn metric conflicts into a question list and chase answers' },
                next: 'press_pool',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把还没弄明白的地方先留白，再去下一站', en: 'Keep key uncertainties explicit and move to the next verification loop' },
                next: 'verification',
                effect: { newsValueDelta: 0 }
            },
            {
                text: { zh: '先把时间线放出来，让看见的人来补线索', en: 'Publish a public timeline draft and invite readers plus sources to submit corrections' },
                next: 'press_pool',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    press_pool: {
        id: 'press_pool',
        title: { zh: '联合采访池', en: 'Press Pool' },
        text: textDB.pressPool,
        choices: [
            {
                text: { zh: '轮到你时连问三句：现在多少、什么时候更新、前后为什么不一样', en: 'Press on denominator, update time, and metric-definition changes' },
                next: 'official_response',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '追问他们下一次几点说清楚', en: 'Secure a correction window and scheduled update cadence' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '怕被请出去，于是把最硬的问题吞回去', en: 'Soften sharp questions to preserve access' },
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
            { type: 'video', src: 'arts/视频1.mp4', autoplay: true, muted: true, loop: true, controls: false }
        ],
        choices: [
            {
                text: { zh: '拿着视频去现场比楼和路，看看是不是同一个地方', en: 'Geolocate with roofline, wind, and timestamp triple checks' },
                next: 'osint_lab',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '顺着转发一层层找，看看是谁最先发', en: 'Trace the repost chain to original uploader and re-edit points' },
                next: 'community_hearings',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先去问官方一句，再决定要不要继续追视频', en: 'Get official response first, then decide how far to chase the clip source' },
                next: 'official_response',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    osint_lab: {
        id: 'osint_lab',
        title: { zh: '开源核查实验室', en: 'OSINT Lab' },
        text: textDB.osintLab,
        choices: [
            {
                text: { zh: '翻旧地图和街景，试着找出拍摄位置', en: 'Reconstruct filming location from archived street views and terrain' },
                next: 'official_response',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '反复听这段声音，找剪过的痕迹', en: 'Compare audio spectra to detect possible recomposition' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先把半成品结论丢进群里试反应', en: 'Leak preliminary findings to a chat group for reaction' },
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
                text: { zh: '把每一句话都写清楚：这句确定，那句还不确定', en: 'Annotate each quote as confirmed vs pending before citing' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '去要一份值班记录，把缺的那几分钟补上', en: 'Request incident-log excerpts to patch timeline gaps' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先用“真的爆炸了吗？”当标题推送出去', en: 'Push a strong “Explosion?” headline first' },
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
                text: { zh: '把证言分成三堆：亲眼看到的、听别人说的、网上传的', en: 'Reorder testimony into firsthand, relayed, and rumor tiers' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把每个人说的时间写在纸上，找重合的那几段', en: 'Build a witness-time matrix and find cross-checkable overlaps' },
                next: 'verification',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先剪最激动的片段发出去吸引人', en: 'Lead with the most emotionally charged clip for clicks' },
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
                text: { zh: '先等一个不相关的人把话说实，再发主稿', en: 'Hold the main story until an independent source lands' },
                next: 'editorial_review',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先发“已确认”版本，把没确认的单独放旁边', en: 'Publish a dual-track version: verified core plus pending sidebar' },
                next: 'drafting',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '把复杂情况硬写成一句肯定话', en: 'Compress complex uncertainty into one certain conclusion' },
                next: 'rapid_update',
                effect: { newsValueDelta: -2 }
            },
            {
                text: { zh: '先把你怎么查的过程公开，再发主稿', en: 'Ship a verification log with a correction channel before publishing the main piece' },
                next: 'editorial_review',
                effect: { newsValueDelta: 3 }
            }
        ]
    },

    rapid_update: {
        id: 'rapid_update',
        title: { zh: '快更压力线', en: 'Rapid Update Pressure' },
        text: textDB.rapidUpdate,
        choices: [
            {
                text: { zh: '改成滚动更新稿，每一段都写上时间和来源', en: 'Switch to a correction-ready live draft with timestamped sourcing' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先停十分钟，回头把证据顺序重新排', en: 'Pause for ten minutes and rebuild evidence priorities' },
                next: 'drafting',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '继续抢时间，争议留到发完再说', en: 'Keep racing on speed and defer disputes until after publication' },
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
                text: { zh: '开头先写三句：现在知道什么、不知道什么、下一步去哪里', en: 'Use a three-part lead: known, unknown, and next verification step' },
                next: 'editorial_review',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先告诉大家往哪走、怎么保护自己，再讲来龙去脉', en: 'Lead with evacuation and health guidance, then present evidence chain' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先用最炸的句子抓人，后面再慢慢补条件', en: 'Hook readers with a sensational lead, then add caveats later' },
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
                text: { zh: '和编辑一条条过稿，把每句都挂上来源', en: 'Run legal/risk checks and bind each key line to a source' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '找同事试读，看哪段最容易看错就立刻改', en: 'Run a reader-comprehension pass and fix high-misread sections' },
                next: 'final_decision',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '不复核了，抢在别人前面先上线', en: 'Skip review to publish three minutes ahead of competitors' },
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
                text: { zh: '发完整版，把来源和下一次更新时间都写上', en: 'Publish full story with source appendix and update commitment' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先发短版，再告诉大家几点补全', en: 'Publish a concise bulletin and pin the next update time' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
            },
            {
                text: { zh: '先推一个大标题，正文后面再补', en: 'Push a headline alert first and fill body details later' },
                next: 'ending_final',
                effect: { newsValueDelta: -2 }
            },
            {
                text: { zh: '多等八分钟，再补一个旁证后发布', en: 'Delay by eight minutes and publish after adding one independent source' },
                next: 'ending_final',
                effect: { newsValueDelta: 3 }
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
