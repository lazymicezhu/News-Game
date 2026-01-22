import { textDB } from '../data/textDB.js';

/**
 * 场景数据（加州野火版）
 */
export const scenes = {
    intro: {
        id: 'intro',
        title: {
            zh: '序章：2025 加州野火蔓延',
            en: 'Prologue: 2025 California Wildfire Spreads'
        },
        image: 'arts/大纪元-加州野火1.jpg',
        text: textDB.intro,
        choices: [
            {
                text: {
                    zh: '参加 Cal Fire 线上简报，拿官方数据',
                    en: 'Join the Cal Fire briefing for official numbers'
                },
                next: 'cal_fire_briefing',
                effect: { angle: 'official' },
                hint: {
                    zh: '获取权威数据，视角偏官方',
                    en: 'Authoritative data with an official-leaning view'
                }
            },
            {
                text: {
                    zh: '去圣罗莎高中避难所，听居民怎么说',
                    en: 'Head to the Santa Rosa shelter to hear residents'
                },
                next: 'evac_center',
                effect: { angle: 'community' },
                hint: {
                    zh: '人情味足，需自行求证',
                    en: 'Human stories, verification needed by yourself'
                }
            },
            {
                text: {
                    zh: '先刷社交媒体，看热帖和视频',
                    en: 'Scroll social media for trending posts and videos'
                },
                next: 'social_feed',
                effect: { angle: 'hype' },
                hint: {
                    zh: '快速捕捉情绪，风险是误传',
                    en: 'Fast pulse on emotions, risk of misinformation'
                }
            }
        ]
    },

    cal_fire_briefing: {
        id: 'cal_fire_briefing',
        title: { zh: 'Cal Fire 简报', en: 'Cal Fire Briefing' },
        text: textDB.calBriefing,
        choices: [
            {
                text: {
                    zh: '按官方口径发快讯，突出控制率与部署',
                    en: 'Publish quick update with official framing, highlight containment and deployments'
                },
                next: 'press_pool',
                effect: { angle: 'official' }
            },
            {
                text: {
                    zh: '索要战术态势图和空拍，继续深挖',
                    en: 'Request tactical map and aerials to dig deeper'
                },
                next: 'suppression_ops',
                effect: { angle: 'balanced' }
            }
        ]
    },

    suppression_ops: {
        id: 'suppression_ops',
        title: { zh: '火场作战态势', en: 'Operations Update' },
        text: textDB.suppressionOps,
        choices: [
            {
                text: {
                    zh: '随机组前往北线空投点，写前线稿',
                    en: 'Embed with a crew to the north drop point for a frontline story'
                },
                next: 'frontline_embed',
                effect: { angle: 'balanced' }
            },
            {
                text: {
                    zh: '带数据去避难所，对照居民感受',
                    en: 'Bring the data to the shelter and compare with residents'
                },
                next: 'evac_center',
                effect: { angle: 'balanced' }
            },
            {
                text: {
                    zh: '跟随补给车队，记录物资调度',
                    en: 'Follow the supply convoy and document logistics'
                },
                next: 'supply_convoy',
                effect: { angle: 'balanced' }
            }
        ]
    },

    evac_center: {
        id: 'evac_center',
        title: { zh: '圣罗莎避难所', en: 'Santa Rosa Shelter' },
        image: 'arts/大纪元-加州野火1.jpg',
        text: textDB.evacCenter,
        choices: [
            {
                text: {
                    zh: '写居民口述与恐惧情绪，突出人情面',
                    en: 'Write resident testimonies and fear, leaning on the human angle'
                },
                next: 'community_voices',
                effect: { angle: 'community' }
            },
            {
                text: {
                    zh: '核实物资短缺，联系县府物流',
                    en: 'Verify the shortages and call county logistics'
                },
                next: 'logistics_check',
                effect: { angle: 'balanced' }
            },
            {
                text: {
                    zh: '顺手记录“化工爆炸”传闻并求证',
                    en: 'Note the "chemical explosion" rumor and try to verify'
                },
                next: 'fact_check',
                effect: { angle: 'balanced' }
            },
            {
                text: {
                    zh: '联系救援组织，了解资源缺口',
                    en: 'Contact relief groups to understand resource gaps'
                },
                next: 'relief_org',
                effect: { angle: 'community' }
            }
        ]
    },

    social_feed: {
        id: 'social_feed',
        title: { zh: '社交媒体热帖', en: 'Social Feed' },
        text: textDB.socialFeed,
        choices: [
            {
                text: { zh: '直接嵌入热帖发稿，冲点击', en: 'Embed the viral post and publish for clicks' },
                next: 'rumor_spread',
                effect: { angle: 'hype' }
            },
            {
                text: { zh: '追溯视频元数据和位置，先求证', en: 'Trace the video metadata and location before publishing' },
                next: 'fact_check',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '离开屏幕，去避难所现场', en: 'Leave the screen and go to the shelter' },
                next: 'evac_center',
                effect: { angle: 'community' }
            },
            {
                text: { zh: '转向空气质量与健康风险', en: 'Shift to air quality and health risks' },
                next: 'air_quality',
                effect: { angle: 'balanced' }
            }
        ]
    },

    rumor_spread: {
        id: 'rumor_spread',
        title: { zh: '热度与风险', en: 'Heat vs Risk' },
        text: textDB.rumorRisk,
        choices: [
            {
                text: { zh: '维持震撼口吻，继续推送', en: 'Keep the dramatic tone and push on' },
                next: 'clickbait_draft',
                effect: { angle: 'hype' }
            },
            {
                text: { zh: '担心误导，改去求证', en: 'Worried about misinfo, switch to verification' },
                next: 'fact_check',
                effect: { angle: 'balanced' }
            }
        ]
    },

    fact_check: {
        id: 'fact_check',
        title: { zh: '交叉求证', en: 'Cross-check' },
        text: {
            zh: '消防表示“暂无化工仓库爆炸报告”，并发你一张当日巡查照片；你利用反搜发现热帖视频为 2017 年旧闻。',
            en: 'Dispatch says there is "no chemical warehouse explosion report" and sends you a patrol photo; your reverse search shows the viral video is from 2017.'
        },
        choices: [
            {
                text: { zh: '把官方回应与现场观察并列，写平衡稿', en: 'Pair the official response with observations for a balanced story' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '整合数据与回应，写调查稿', en: 'Merge data and responses into an investigative piece' },
                next: 'investigative_draft',
                effect: { angle: 'balanced' }
            }
        ]
    },

    community_voices: {
        id: 'community_voices',
        title: { zh: '社区声音', en: 'Community Voices' },
        text: textDB.communityVoices,
        choices: [
            {
                text: { zh: '融合官方数据与居民经历，写平衡稿', en: 'Blend official data with resident experiences for a balanced piece' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '突出恐慌与质疑语气，追求流量', en: 'Lean into panic and doubt for traffic' },
                next: 'clickbait_draft',
                effect: { angle: 'hype' }
            }
        ]
    },

    logistics_check: {
        id: 'logistics_check',
        title: { zh: '物资核查', en: 'Logistics Check' },
        text: textDB.logisticsCheck,
        choices: [
            {
                text: { zh: '写平衡稿，既写短缺也写补给进度', en: 'Write a balanced piece on shortages and supply progress' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '将延误放大成“严重失职”角度', en: 'Frame the delay as "serious negligence" for impact' },
                next: 'clickbait_draft',
                effect: { angle: 'hype' }
            },
            {
                text: { zh: '转向热线核实撤离信息', en: 'Call the hotline to verify evacuation info' },
                next: 'county_hotline',
                effect: { angle: 'balanced' }
            }
        ]
    },

    geolocate: {
        id: 'geolocate',
        title: { zh: '视频溯源', en: 'Video Trace' },
        text: textDB.geolocate,
        choices: [
            {
                text: { zh: '写明是旧视频，在稿件里澄清', en: 'State it is an old video and clarify in your story' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '仍然用作“可能性”素材，追求流量', en: 'Use it as "possible" material anyway for clicks' },
                next: 'clickbait_draft',
                effect: { angle: 'hype' }
            }
        ]
    },

    frontline_embed: {
        id: 'frontline_embed',
        title: { zh: '前线随行', en: 'Frontline Embed' },
        text: textDB.frontlineEmbed,
        choices: [
            {
                text: { zh: '用前线细节与安全提醒写调查稿', en: 'Use frontline details and safety warnings for an investigative story' },
                next: 'investigative_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '以惊险视角写流量稿', en: 'Write a thrilling, click-driven piece' },
                next: 'clickbait_draft',
                effect: { angle: 'hype' }
            }
        ]
    },

    press_pool: {
        id: 'press_pool',
        title: { zh: '联合采访区', en: 'Press Pool' },
        text: textDB.pressPool,
        choices: [
            {
                text: { zh: '追问避难所与物资调度细节', en: 'Press for shelter and supply details' },
                next: 'relief_org',
                effect: { angle: 'community' }
            },
            {
                text: { zh: '整理官方口径，准备快讯', en: 'Summarize official line and draft a brief' },
                next: 'official_draft',
                effect: { angle: 'official' }
            },
            {
                text: { zh: '要求公开空气质量与健康风险', en: 'Request air-quality and health risk details' },
                next: 'air_quality',
                effect: { angle: 'balanced' }
            }
        ]
    },

    air_quality: {
        id: 'air_quality',
        title: { zh: '空气质量监测', en: 'Air Quality Monitoring' },
        text: textDB.airQuality,
        choices: [
            {
                text: { zh: '去医院采访烟尘影响', en: 'Visit a hospital to interview about smoke exposure' },
                next: 'hospital_visit',
                effect: { angle: 'community' }
            },
            {
                text: { zh: '回数据台做扩散可视化', en: 'Go to the data desk for spread visualization' },
                next: 'data_desk',
                effect: { angle: 'balanced' }
            }
        ]
    },

    hospital_visit: {
        id: 'hospital_visit',
        title: { zh: '医院走访', en: 'Hospital Visit' },
        text: textDB.hospitalVisit,
        choices: [
            {
                text: { zh: '强调健康风险与应对措施', en: 'Highlight health risks and response measures' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '追问医疗资源缺口', en: 'Press on medical resource gaps' },
                next: 'investigative_draft',
                effect: { angle: 'balanced' }
            }
        ]
    },

    data_desk: {
        id: 'data_desk',
        title: { zh: '数据台', en: 'Data Desk' },
        text: textDB.dataDesk,
        choices: [
            {
                text: { zh: '发布扩散路线图并说明', en: 'Publish a spread map with explanation' },
                next: 'balanced_draft',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '深挖异常数据并继续调查', en: 'Dig into anomalies and keep investigating' },
                next: 'investigative_draft',
                effect: { angle: 'balanced' }
            }
        ]
    },

    relief_org: {
        id: 'relief_org',
        title: { zh: '救援组织', en: 'Relief Organization' },
        text: textDB.reliefOrg,
        choices: [
            {
                text: { zh: '跟进物资调度与缺口', en: 'Follow up on supply dispatch and gaps' },
                next: 'logistics_check',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '记录居民互助与情绪', en: 'Record mutual aid and public sentiment' },
                next: 'community_voices',
                effect: { angle: 'community' }
            }
        ]
    },

    supply_convoy: {
        id: 'supply_convoy',
        title: { zh: '补给车队', en: 'Supply Convoy' },
        text: textDB.supplyConvoy,
        choices: [
            {
                text: { zh: '随车跟拍补给抵达', en: 'Ride along and document supply arrival' },
                next: 'logistics_check',
                effect: { angle: 'balanced' }
            },
            {
                text: { zh: '转回前线观察火线变化', en: 'Return to the frontline to observe changes' },
                next: 'frontline_embed',
                effect: { angle: 'balanced' }
            }
        ]
    },

    county_hotline: {
        id: 'county_hotline',
        title: { zh: '县府热线', en: 'County Hotline' },
        text: textDB.countyHotline,
        choices: [
            {
                text: { zh: '整理撤离路线与范围指引', en: 'Compile evacuation routes and zones' },
                next: 'balanced_draft',
                effect: { angle: 'official' }
            },
            {
                text: { zh: '汇总疑问再追问官方', en: 'Bundle questions and press officials again' },
                next: 'press_pool',
                effect: { angle: 'official' }
            }
        ]
    },

    // 结局
    official_draft: {
        id: 'official_draft',
        title: { zh: '结局：官方口径为主', en: 'Ending: Official-first' },
        text: textDB.officialDraft,
        choices: []
    },

    balanced_draft: {
        id: 'balanced_draft',
        title: { zh: '结局：平衡而透明', en: 'Ending: Balanced and Transparent' },
        text: textDB.balancedDraft,
        choices: []
    },

    clickbait_draft: {
        id: 'clickbait_draft',
        title: { zh: '结局：流量至上', en: 'Ending: Traffic Above All' },
        text: textDB.clickbaitDraft,
        choices: []
    },

    investigative_draft: {
        id: 'investigative_draft',
        title: { zh: '结局：调查向深', en: 'Ending: Investigative' },
        text: textDB.investigativeDraft,
        choices: []
    }
};
