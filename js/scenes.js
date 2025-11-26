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
                effect: { angle: 'official', trustDelta: 4 },
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
                effect: { angle: 'community', trustDelta: 1 },
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
                effect: { angle: 'hype', trustDelta: -2 },
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
        source: {
            label: { zh: '官方通报', en: 'Official bulletin' },
            details: { zh: 'Cal Fire 值班长发布，带时间戳', en: 'Issued by on-duty Cal Fire chief with timestamp' },
            credibility: 'high'
        },
        text: textDB.calBriefing,
        evidence: [
            {
                id: 'calfire_bulletin',
                title: { zh: '官方快报截图', en: 'Official bulletin screenshot' },
                content: { zh: '包含火线长度、控制率、避难所位置。', en: 'Shows fireline length, containment, shelter locations.' },
                credibility: { zh: '高', en: 'High' }
            }
        ],
        choices: [
            {
                text: {
                    zh: '按官方口径发快讯，突出控制率与部署',
                    en: 'Publish quick update with official framing, highlight containment and deployments'
                },
                next: 'official_draft',
                effect: { angle: 'official', trustDelta: 2 }
            },
            {
                text: {
                    zh: '索要战术态势图和空拍，继续深挖',
                    en: 'Request tactical map and aerials to dig deeper'
                },
                next: 'suppression_ops',
                effect: { angle: 'balanced', trustDelta: 3 }
            }
        ]
    },

    suppression_ops: {
        id: 'suppression_ops',
        title: { zh: '火场作战态势', en: 'Operations Update' },
        source: {
            label: { zh: '作战官口述', en: 'Ops officer briefing' },
            details: { zh: '值班作战官展示态势图', en: 'Duty ops officer walks through the map' },
            credibility: 'high'
        },
        text: textDB.suppressionOps,
        evidence: [
            {
                id: 'ops_map',
                title: { zh: '作战态势图', en: 'Operations map' },
                content: { zh: '标出北线空投、南线反火计划，含风向箭头。', en: 'Marks north air drops, south backburn plan, with wind arrows.' },
                credibility: { zh: '高', en: 'High' }
            },
            {
                id: 'safety_warning',
                title: { zh: '安全提醒', en: 'Safety reminder' },
                content: { zh: '请媒体提醒公众勿私返家，等待官方开放。', en: 'Tell the public not to return home on their own; wait for official clearance.' },
                credibility: { zh: '高', en: 'High' }
            }
        ],
        choices: [
            {
                text: {
                    zh: '随机组前往北线空投点，写前线稿',
                    en: 'Embed with a crew to the north drop point for a frontline story'
                },
                next: 'frontline_embed',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: {
                    zh: '带数据去避难所，对照居民感受',
                    en: 'Bring the data to the shelter and compare with residents'
                },
                next: 'evac_center',
                effect: { angle: 'balanced', trustDelta: 2 }
            }
        ]
    },

    evac_center: {
        id: 'evac_center',
        title: { zh: '圣罗莎避难所', en: 'Santa Rosa Shelter' },
        image: 'arts/大纪元-加州野火1.jpg',
        source: {
            label: { zh: '目击者口述', en: 'Eyewitness accounts' },
            details: { zh: '志愿者与撤离居民现场描述', en: 'On-site descriptions from volunteers and evacuees' },
            credibility: 'medium'
        },
        text: textDB.evacCenter,
        evidence: [
            { id: 'shelter_photo', title: { zh: '避难所照片', en: 'Shelter photo' }, content: { zh: '折叠床、宠物笼、空气净化器排布。', en: 'Rows of cots, pet crates, and air purifiers.' }, credibility: { zh: '中', en: 'Medium' } },
            { id: 'supply_list', title: { zh: '志愿者物资清单', en: 'Volunteer supply list' }, content: { zh: '水、婴儿用品短缺；口罩库存紧张。', en: 'Water and baby supplies are short; masks are tight.' }, credibility: { zh: '中', en: 'Medium' } }
        ],
        choices: [
            {
                text: {
                    zh: '写居民口述与恐惧情绪，突出人情面',
                    en: 'Write resident testimonies and fear, leaning on the human angle'
                },
                next: 'community_voices',
                effect: { angle: 'community', trustDelta: 1 }
            },
            {
                text: {
                    zh: '核实物资短缺，联系县府物流',
                    en: 'Verify the shortages and call county logistics'
                },
                next: 'logistics_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: {
                    zh: '顺手记录“化工爆炸”传闻并求证',
                    en: 'Note the "chemical explosion" rumor and try to verify'
                },
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 1 }
            }
        ]
    },

    social_feed: {
        id: 'social_feed',
        title: { zh: '社交媒体热帖', en: 'Social Feed' },
        unverified: true,
        source: {
            label: { zh: '社交媒体帖', en: 'Social post' },
            details: { zh: '未证实短视频与热帖', en: 'Unverified short video and viral posts' },
            credibility: 'low'
        },
        text: textDB.socialFeed,
        evidence: [
            { id: 'viral_clip_wildfire', title: { zh: '热帖视频', en: 'Viral video' }, content: { zh: '模糊夜间火光，缺乏水印和定位。', en: 'Blurry night flames, no watermark or location.' }, credibility: { zh: '低', en: 'Low' } }
        ],
        choices: [
            {
                text: { zh: '直接嵌入热帖发稿，冲点击', en: 'Embed the viral post and publish for clicks' },
                next: 'rumor_spread',
                effect: { angle: 'hype', trustDelta: -5 }
            },
            {
                text: { zh: '追溯视频元数据和位置，先求证', en: 'Trace the video metadata and location before publishing' },
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: { zh: '离开屏幕，去避难所现场', en: 'Leave the screen and go to the shelter' },
                next: 'evac_center',
                effect: { angle: 'community', trustDelta: 0 }
            }
        ]
    },

    rumor_spread: {
        id: 'rumor_spread',
        title: { zh: '热度与风险', en: 'Heat vs Risk' },
        unverified: true,
        source: { label: { zh: '二手传播', en: 'Second-hand repost' }, details: { zh: '未经核实的二次转载', en: 'Unverified resharing' }, credibility: 'low' },
        text: textDB.rumorRisk,
        choices: [
            {
                text: { zh: '维持震撼口吻，继续推送', en: 'Keep the dramatic tone and push on' },
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -4 }
            },
            {
                text: { zh: '担心误导，改去求证', en: 'Worried about misinfo, switch to verification' },
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            }
        ]
    },

    fact_check: {
        id: 'fact_check',
        title: { zh: '交叉求证', en: 'Cross-check' },
        source: {
            label: { zh: '官方回应', en: 'Official response' },
            details: { zh: '消防调度员电话回应：未接化工泄漏报告', en: 'Fire dispatcher by phone: no chemical leak reports' },
            credibility: 'high'
        },
        text: {
            zh: '消防表示“暂无化工仓库爆炸报告”，并发你一张当日巡查照片；你利用反搜发现热帖视频为 2017 年旧闻。',
            en: 'Dispatch says there is "no chemical warehouse explosion report" and sends you a patrol photo; your reverse search shows the viral video is from 2017.'
        },
        evidence: [
            { id: 'fire_call_wildfire', title: { zh: '消防通话摘要', en: 'Fire dispatch call summary' }, content: { zh: '未接到化工泄漏报告，巡查持续进行。', en: 'No chemical leak reports received; patrols are ongoing.' }, credibility: { zh: '高', en: 'High' } },
            { id: 'patrol_photo_wildfire', title: { zh: '巡查照片', en: 'Patrol photo' }, content: { zh: '仓库外观完好，拍摄时间 10:35，带水印。', en: 'Warehouse exterior intact, shot 10:35 with watermark.' }, credibility: { zh: '高', en: 'High' } },
            { id: 'osint_note', title: { zh: '反搜结果', en: 'Open-source trace' }, content: { zh: '视频水印显示 2017 年旧火场。', en: 'Watermark shows the clip is from a 2017 fire.' }, credibility: { zh: '高', en: 'High' } }
        ],
        choices: [
            {
                text: { zh: '把官方回应与现场观察并列，写平衡稿', en: 'Pair the official response with observations for a balanced story' },
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: { zh: '整合数据与回应，写调查稿', en: 'Merge data and responses into an investigative piece' },
                next: 'investigative_draft',
                effect: { angle: 'balanced', trustDelta: 5 }
            }
        ]
    },

    community_voices: {
        id: 'community_voices',
        title: { zh: '社区声音', en: 'Community Voices' },
        source: { label: { zh: '当事人口述', en: 'First-person accounts' }, details: { zh: '撤离居民的恐惧与愤怒', en: 'Evacuees\' fear and anger' }, credibility: 'medium' },
        text: textDB.communityVoices,
        choices: [
            {
                text: { zh: '融合官方数据与居民经历，写平衡稿', en: 'Blend official data with resident experiences for a balanced piece' },
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 3 }
            },
            {
                text: { zh: '突出恐慌与质疑语气，追求流量', en: 'Lean into panic and doubt for traffic' },
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -4 }
            }
        ]
    },

    logistics_check: {
        id: 'logistics_check',
        title: { zh: '物资核查', en: 'Logistics Check' },
        source: { label: { zh: '物流官回应', en: 'Logistics officer response' }, details: { zh: '县府物流官与车队 GPS 数据', en: 'County logistics officer with convoy GPS data' }, credibility: 'high' },
        text: textDB.logisticsCheck,
        evidence: [
            { id: 'logistics_call', title: { zh: '物流通话记录', en: 'Logistics call log' }, content: { zh: '确认奶粉不足，补给车预计 1 小时抵达。', en: 'Confirms formula shortage; supply trucks ETA one hour.' }, credibility: { zh: '高', en: 'High' } },
            { id: 'gps_track', title: { zh: '车队 GPS', en: 'Convoy GPS' }, content: { zh: '显示车队位置与预计到达时间。', en: 'Shows convoy location and estimated arrival.' }, credibility: { zh: '高', en: 'High' } }
        ],
        choices: [
            {
                text: { zh: '写平衡稿，既写短缺也写补给进度', en: 'Write a balanced piece on shortages and supply progress' },
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 3 }
            },
            {
                text: { zh: '将延误放大成“严重失职”角度', en: 'Frame the delay as "serious negligence" for impact' },
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
            }
        ]
    },

    geolocate: {
        id: 'geolocate',
        title: { zh: '视频溯源', en: 'Video Trace' },
        text: textDB.geolocate,
        source: { label: { zh: '自研溯源', en: 'Self OSINT' }, details: { zh: '通过反搜核实元数据', en: 'Reverse search to verify metadata' }, credibility: 'high' },
        choices: [
            {
                text: { zh: '写明是旧视频，在稿件里澄清', en: 'State it is an old video and clarify in your story' },
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: { zh: '仍然用作“可能性”素材，追求流量', en: 'Use it as "possible" material anyway for clicks' },
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
            }
        ]
    },

    frontline_embed: {
        id: 'frontline_embed',
        title: { zh: '前线随行', en: 'Frontline Embed' },
        source: { label: { zh: '前线指挥', en: 'Frontline command' }, details: { zh: '直升机机组长现场口述', en: 'Helicopter crew chief on-site' }, credibility: 'high' },
        text: textDB.frontlineEmbed,
        evidence: [
            { id: 'thermal_image', title: { zh: '热成像截图', en: 'Thermal image snapshot' }, content: { zh: '暗火点仍在居民区边缘。', en: 'Hotspots remain at the edge of the neighborhood.' }, credibility: { zh: '高', en: 'High' } }
        ],
        choices: [
            {
                text: { zh: '用前线细节与安全提醒写调查稿', en: 'Use frontline details and safety warnings for an investigative story' },
                next: 'investigative_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: { zh: '以惊险视角写流量稿', en: 'Write a thrilling, click-driven piece' },
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
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
