-- ===========================================
-- Musical Record 数据库初始化
-- 主键设计：musical/artist 使用 name 做主键
-- 认证：使用 Supabase Auth，所有表包含 user_id
-- ===========================================

-- 剧目类型枚举
CREATE TYPE musical_type AS ENUM ('话剧', '中国音乐剧', '非中音乐剧', '舞剧');

-- 演员类型枚举
CREATE TYPE actor_type AS ENUM ('主演', '群演');

-- 1. 剧目表（主键为 name）
CREATE TABLE musical (
    name TEXT PRIMARY KEY,
    type musical_type NOT NULL,
    brand TEXT DEFAULT '',
    plot TEXT DEFAULT '',
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 演员表（主键为 name）
CREATE TABLE artist (
    name TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 场次表
CREATE TABLE show (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_time TIMESTAMP WITH TIME ZONE,
    musical_name TEXT NOT NULL REFERENCES musical(name) ON UPDATE CASCADE ON DELETE RESTRICT,
    city TEXT DEFAULT '',
    theater TEXT DEFAULT '',
    seat TEXT DEFAULT '',
    plot_score INTEGER CHECK (plot_score BETWEEN 1 AND 5),
    visual_score INTEGER CHECK (visual_score BETWEEN 1 AND 5),
    acting_score INTEGER CHECK (acting_score BETWEEN 1 AND 5),
    script_score INTEGER CHECK (script_score BETWEEN 1 AND 5),
    singing_score INTEGER CHECK (singing_score BETWEEN 1 AND 5),
    note TEXT DEFAULT '',
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 演员评价表
CREATE TABLE actor_review (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES show(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL REFERENCES artist(name) ON UPDATE CASCADE ON DELETE RESTRICT,
    actor_order INTEGER,
    actor_type actor_type DEFAULT '主演',
    role TEXT DEFAULT '',
    review TEXT DEFAULT '',
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_show_musical_name ON show(musical_name);
CREATE INDEX idx_show_show_time ON show(show_time DESC);
CREATE INDEX idx_show_user_id ON show(user_id);
CREATE INDEX idx_actor_review_show_id ON actor_review(show_id);
CREATE INDEX idx_actor_review_artist_name ON actor_review(artist_name);
CREATE INDEX idx_actor_review_user_id ON actor_review(user_id);
CREATE INDEX idx_musical_user_id ON musical(user_id);
CREATE INDEX idx_artist_user_id ON artist(user_id);

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每张表添加更新时间触发器
CREATE TRIGGER update_musical_updated_at
    BEFORE UPDATE ON musical
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_artist_updated_at
    BEFORE UPDATE ON artist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_show_updated_at
    BEFORE UPDATE ON show
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_actor_review_updated_at
    BEFORE UPDATE ON actor_review
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- Row Level Security（RLS）
-- 每个用户只能访问自己的数据
-- ===========================================

ALTER TABLE musical ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist ENABLE ROW LEVEL SECURITY;
ALTER TABLE show ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_review ENABLE ROW LEVEL SECURITY;

-- musical 策略
CREATE POLICY "Users can view own musicals" ON musical
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own musicals" ON musical
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own musicals" ON musical
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own musicals" ON musical
    FOR DELETE USING (auth.uid() = user_id);

-- artist 策略
CREATE POLICY "Users can view own artists" ON artist
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own artists" ON artist
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artists" ON artist
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artists" ON artist
    FOR DELETE USING (auth.uid() = user_id);

-- show 策略
CREATE POLICY "Users can view own shows" ON show
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shows" ON show
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shows" ON show
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shows" ON show
    FOR DELETE USING (auth.uid() = user_id);

-- actor_review 策略
CREATE POLICY "Users can view own actor_reviews" ON actor_review
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actor_reviews" ON actor_review
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actor_reviews" ON actor_review
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actor_reviews" ON actor_review
    FOR DELETE USING (auth.uid() = user_id);
