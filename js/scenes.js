import { textDB } from '../data/textDB.js';

/**
 * 场景数据（加州野火版）
 */
export const scenes = {
    intro: {
        id: 'intro',
        title: '序章：2025 加州野火蔓延',
        image: 'arts/大纪元-加州野火1.jpg',
        text: textDB.intro,
        choices: [
            {
                text: '参加 Cal Fire 线上简报，拿官方数据',
                next: 'cal_fire_briefing',
                effect: { angle: 'official', trustDelta: 4 },
                hint: '获取权威数据，视角偏官方'
            },
            {
                text: '去圣罗莎高中避难所，听居民怎么说',
                next: 'evac_center',
                effect: { angle: 'community', trustDelta: 1 },
                hint: '人情味足，需自行求证'
            },
            {
                text: '先刷社交媒体，看热帖和视频',
                next: 'social_feed',
                effect: { angle: 'hype', trustDelta: -2 },
                hint: '快速捕捉情绪，风险是误传'
            }
        ]
    },

    cal_fire_briefing: {
        id: 'cal_fire_briefing',
        title: 'Cal Fire 简报',
        source: { label: '官方通报', details: 'Cal Fire 值班长发布，带时间戳', credibility: 'high' },
        text: textDB.calBriefing,
        evidence: [
            { id: 'calfire_bulletin', title: '官方快报截图', content: '包含火线长度、控制率、避难所位置。', credibility: '高' }
        ],
        choices: [
            {
                text: '按官方口径发快讯，突出控制率与部署',
                next: 'official_draft',
                effect: { angle: 'official', trustDelta: 2 }
            },
            {
                text: '索要战术态势图和空拍，继续深挖',
                next: 'suppression_ops',
                effect: { angle: 'balanced', trustDelta: 3 }
            }
        ]
    },

    suppression_ops: {
        id: 'suppression_ops',
        title: '火场作战态势',
        source: { label: '作战官口述', details: '值班作战官展示态势图', credibility: 'high' },
        text: textDB.suppressionOps,
        evidence: [
            { id: 'ops_map', title: '作战态势图', content: '标出北线空投、南线反火计划，含风向箭头。', credibility: '高' },
            { id: 'safety_warning', title: '安全提醒', content: '请媒体提醒公众勿私返家，等待官方开放。', credibility: '高' }
        ],
        choices: [
            {
                text: '随机组前往北线空投点，写前线稿',
                next: 'frontline_embed',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: '带数据去避难所，对照居民感受',
                next: 'evac_center',
                effect: { angle: 'balanced', trustDelta: 2 }
            }
        ]
    },

    evac_center: {
        id: 'evac_center',
        title: '圣罗莎避难所',
        image: 'arts/大纪元-加州野火1.jpg',
        source: { label: '目击者口述', details: '志愿者与撤离居民现场描述', credibility: 'medium' },
        text: textDB.evacCenter,
        evidence: [
            { id: 'shelter_photo', title: '避难所照片', content: '折叠床、宠物笼、空气净化器排布。', credibility: '中' },
            { id: 'supply_list', title: '志愿者物资清单', content: '水、婴儿用品短缺；口罩库存紧张。', credibility: '中' }
        ],
        choices: [
            {
                text: '写居民口述与恐惧情绪，突出人情面',
                next: 'community_voices',
                effect: { angle: 'community', trustDelta: 1 }
            },
            {
                text: '核实物资短缺，联系县府物流',
                next: 'logistics_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: '顺手记录“化工爆炸”传闻并求证',
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 1 }
            }
        ]
    },

    social_feed: {
        id: 'social_feed',
        title: '社交媒体热帖',
        unverified: true,
        source: { label: '社交媒体帖', details: '未证实短视频与热帖', credibility: 'low' },
        text: textDB.socialFeed,
        evidence: [
            { id: 'viral_clip_wildfire', title: '热帖视频', content: '模糊夜间火光，缺乏水印和定位。', credibility: '低' }
        ],
        choices: [
            {
                text: '直接嵌入热帖发稿，冲点击',
                next: 'rumor_spread',
                effect: { angle: 'hype', trustDelta: -5 }
            },
            {
                text: '追溯视频元数据和位置，先求证',
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            },
            {
                text: '离开屏幕，去避难所现场',
                next: 'evac_center',
                effect: { angle: 'community', trustDelta: 0 }
            }
        ]
    },

    rumor_spread: {
        id: 'rumor_spread',
        title: '热度与风险',
        unverified: true,
        source: { label: '二手传播', details: '未经核实的二次转载', credibility: 'low' },
        text: textDB.rumorRisk,
        choices: [
            {
                text: '维持震撼口吻，继续推送',
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -4 }
            },
            {
                text: '担心误导，改去求证',
                next: 'fact_check',
                effect: { angle: 'balanced', trustDelta: 2 }
            }
        ]
    },

    fact_check: {
        id: 'fact_check',
        title: '交叉求证',
        source: { label: '官方回应', details: '消防调度员电话回应：未接化工泄漏报告', credibility: 'high' },
        text: '消防表示“暂无化工仓库爆炸报告”，并发你一张当日巡查照片；你利用反搜发现热帖视频为 2017 年旧闻。',
        evidence: [
            { id: 'fire_call_wildfire', title: '消防通话摘要', content: '未接到化工泄漏报告，巡查持续进行。', credibility: '高' },
            { id: 'patrol_photo_wildfire', title: '巡查照片', content: '仓库外观完好，拍摄时间 10:35，带水印。', credibility: '高' },
            { id: 'osint_note', title: '反搜结果', content: '视频水印显示 2017 年旧火场。', credibility: '高' }
        ],
        choices: [
            {
                text: '把官方回应与现场观察并列，写平衡稿',
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: '整合数据与回应，写调查稿',
                next: 'investigative_draft',
                effect: { angle: 'balanced', trustDelta: 5 }
            }
        ]
    },

    community_voices: {
        id: 'community_voices',
        title: '社区声音',
        source: { label: '当事人口述', details: '撤离居民的恐惧与愤怒', credibility: 'medium' },
        text: textDB.communityVoices,
        choices: [
            {
                text: '融合官方数据与居民经历，写平衡稿',
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 3 }
            },
            {
                text: '突出恐慌与质疑语气，追求流量',
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -4 }
            }
        ]
    },

    logistics_check: {
        id: 'logistics_check',
        title: '物资核查',
        source: { label: '物流官回应', details: '县府物流官与车队 GPS 数据', credibility: 'high' },
        text: textDB.logisticsCheck,
        evidence: [
            { id: 'logistics_call', title: '物流通话记录', content: '确认奶粉不足，补给车预计 1 小时抵达。', credibility: '高' },
            { id: 'gps_track', title: '车队 GPS', content: '显示车队位置与预计到达时间。', credibility: '高' }
        ],
        choices: [
            {
                text: '写平衡稿，既写短缺也写补给进度',
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 3 }
            },
            {
                text: '将延误放大成“严重失职”角度',
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
            }
        ]
    },

    geolocate: {
        id: 'geolocate',
        title: '视频溯源',
        text: textDB.geolocate,
        source: { label: '自研溯源', details: '通过反搜核实元数据', credibility: 'high' },
        choices: [
            {
                text: '写明是旧视频，在稿件里澄清',
                next: 'balanced_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: '仍然用作“可能性”素材，追求流量',
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
            }
        ]
    },

    frontline_embed: {
        id: 'frontline_embed',
        title: '前线随行',
        source: { label: '前线指挥', details: '直升机机组长现场口述', credibility: 'high' },
        text: textDB.frontlineEmbed,
        evidence: [
            { id: 'thermal_image', title: '热成像截图', content: '暗火点仍在居民区边缘。', credibility: '高' }
        ],
        choices: [
            {
                text: '用前线细节与安全提醒写调查稿',
                next: 'investigative_draft',
                effect: { angle: 'balanced', trustDelta: 4 }
            },
            {
                text: '以惊险视角写流量稿',
                next: 'clickbait_draft',
                effect: { angle: 'hype', trustDelta: -3 }
            }
        ]
    },

    // 结局
    official_draft: {
        id: 'official_draft',
        title: '结局：官方口径为主',
        text: textDB.officialDraft,
        choices: []
    },

    balanced_draft: {
        id: 'balanced_draft',
        title: '结局：平衡而透明',
        text: textDB.balancedDraft,
        choices: []
    },

    clickbait_draft: {
        id: 'clickbait_draft',
        title: '结局：流量至上',
        text: textDB.clickbaitDraft,
        choices: []
    },

    investigative_draft: {
        id: 'investigative_draft',
        title: '结局：调查向深',
        text: textDB.investigativeDraft,
        choices: []
    }
};
