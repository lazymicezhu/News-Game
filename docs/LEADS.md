# 正式剧情线索触发说明（严格触发）

每个环节只设一条“唯一线索”。
- **追问**：仅当玩家在该环节点击“指定的那一句追问”才会触发线索。
- **采访**：仅当玩家在该环节采访“指定的那一位人物”才会触发线索。
- 线索触发后会弹出“线索收集成功”页面，并在 AI 回复中追加一条线索句子。
- 每条线索每局只触发一次，触发即 +3 新闻价值。

## 逐环节触发条件

### 序章（intro）
- 触发方式：AI 追问
- 指定追问：**“这条传闻最可能从哪里扩散？”**
- 线索 key：lead_intro_rumor_source
- AI 追加线索：有更早的火光片段出现在 01:40 之前。

### 官方简报（briefing）
- 触发方式：AI 追问
- 指定追问：**“撤离通知有没有出现延迟或遗漏？”**
- 线索 key：lead_evac_gap
- AI 追加线索：一处社区的撤离通知可能延后送达。

### 路线选择（route_choice）
- 触发方式：AI 追问
- 指定追问：**“哪一处场域最可能出现信息断层？”**
- 线索 key：lead_route_priority
- AI 追加线索：北侧避难所已超载，南侧仍有余量。

### 避难所（shelter）
- 触发方式：AI 采访
- 指定对象：**避难所志愿者 陈蔚（role id: volunteer）**
- 线索 key：lead_shelter_overflow
- AI 追加线索：夜里出现床位复用，人员在帐区轮换。

### 医院（hospital）
- 触发方式：AI 采访
- 指定对象：**现场记者 王清（role id: reporter）**
- 线索 key：lead_hospital_smoke
- AI 追加线索：高风险人群被建议转移到清洁空气点。

### 物流点（logistics）
- 触发方式：AI 采访
- 指定对象：**避难所志愿者 陈蔚（role id: volunteer）**
- 线索 key：lead_logistics_delay
- AI 追加线索：车队在关键路口改道，ETA 延后。

### 数据整合（data_room）
- 触发方式：AI 追问
- 指定追问：**“数据里哪一处最不一致？”**
- 线索 key：lead_data_anomaly
- AI 追加线索：控制率口径在两家媒体间不一致。

### 传闻追踪（rumor_trace）
- 触发方式：AI 采访
- 指定对象：**消防官员 李政浩（role id: fire）**
- 线索 key：lead_rumor_timestamp
- AI 追加线索：视频时间戳疑似被剪切。

### 官方回应（official_response）
- 触发方式：AI 追问
- 指定追问：**“官方话术里有哪些保留表述？”**
- 线索 key：lead_official_wording
- AI 追加线索：官方反复使用“疑似”“待确认”。

### 社区证言（community_hearings）
- 触发方式：AI 追问
- 指定追问：**“证言里最明显的矛盾点是什么？”**
- 线索 key：lead_community_contradict
- AI 追加线索：地理描述出现相互矛盾。

### 交叉核实（verification）
- 触发方式：AI 追问
- 指定追问：**“还缺少哪一条独立来源？”**
- 线索 key：lead_verification_gap
- AI 追加线索：还缺一条独立来源交叉印证。

### 稿件结构（drafting）
- 触发方式：AI 追问
- 指定追问：**“读者最在意哪个信息？”**
- 线索 key：lead_drafting_angle
- AI 追加线索：撤离路线与空气风险最受关注。

### 发布前抉择（final_decision）
- 触发方式：AI 追问
- 指定追问：**“下一轮更新最关键是什么？”**
- 线索 key：lead_final_update
- AI 追加线索：传闻溯源结果将决定下一轮更新。

## 实现位置
- 触发逻辑：`js/ui.js`（mainSceneLeads）
- 追问列表：`data/followupQuestions.js`
- 线索文案：`js/i18n.js`（lead*Title / lead*Body）
- 证据存储：`js/state.js`（evidence Set）
