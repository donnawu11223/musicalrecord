# 观剧记录产品

私人使用的观剧信息记录与管理产品，支持手机端访问。

## 技术方案

- 前端：React + TypeScript + Vite
- 托管：GitHub + Vercel
- 数据库：Supabase PostgreSQL
- 图片存储：Supabase Storage

---

## 数据库设计

### 表1：剧目表 (musical)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | text | 剧名 |
| poster | text | 海报图片URL |
| type | enum | 类型（话剧/中国音乐剧/非中音乐剧/舞剧） |
| brand | text | 厂牌 |
| plot | text | 剧情（长文本） |
| overall_review | text | 综合评价（长文本） |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 表2：演员表 (artist)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | text | 演员姓名 |
| avatar | text | 头像URL |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 表3：场次表 (show)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| show_time | timestamp | 时间 |
| musical_id | UUID | 剧目ID（关联剧目表） |
| city | text | 城市 |
| theater | text | 剧场 |
| seat | text | 座位 |
| ticket_price | decimal | 票价 |
| paid_amount | decimal | 实付 |
| other_expense | decimal | 其他支出 |
| plot_score | int | 剧情评分（1-5） |
| visual_score | int | 物美评分（1-5） |
| acting_score | int | 演技评分（1-5） |
| script_score | int | 台词评分（1-5） |
| singing_score | int | 唱功评分（1-5） |
| note | text | 备注 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 表4：演员评价表 (actor_review)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| show_id | UUID | 场次ID（关联场次表） |
| artist_id | UUID | 演员ID（关联演员表） |
| actor_order | int | 演员次序 |
| actor_type | enum | 演员类型（主演/群演） |
| role | text | 角色 |
| review | text | 演员评价 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

---

## 前端设计

### 底部Tab导航（5个）

1. 场次记录
2. 剧目记录
3. 演员记录
4. 日历
5. 统计数据

### 页面详情

#### 场次记录页

- 展示方式：卡片（海报+剧目+时间）
- 排序：时间倒序
- 点击进入场次详情
- 详情中剧目和卡司可点击，跳转剧目详情和演员详情

#### 剧目记录页

- 展示方式：待定
- 点击进入剧目详情
- 剧目详情：具体信息 + 场次记录列表

#### 演员记录页

- 展示方式：待定
- 点击进入演员详情
- 演员详情：每场演员评价信息列表

#### 日历页

- 月度总结
- 日历标注有场次的日期
- 下方有卡司统计

#### 统计数据页

- 待补充

---

## 待确认事项

- [x] 剧目类型枚举值：话剧、中国音乐剧、非中音乐剧、舞剧
- [x] 评分范围：1-5整数
- [x] 是否需要登录验证：需要，简单密码保护
- [ ] 场次详情页具体信息展示顺序（后续讨论）
