-- 剧目类型枚举
CREATE TYPE musical_type AS ENUM ('话剧', '中国音乐剧', '非中音乐剧', '舞剧');

-- 演员类型枚举
CREATE TYPE actor_type AS ENUM ('主演', '群演');

-- 1. 剧目表
CREATE TABLE musical (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    poster TEXT,
    type musical_type,
    brand TEXT,
    plot TEXT,
    overall_review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 演员表
CREATE TABLE artist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 场次表
CREATE TABLE show (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_time TIMESTAMP WITH TIME ZONE,
    musical_id UUID REFERENCES musical(id) ON DELETE SET NULL,
    city TEXT,
    theater TEXT,
    seat TEXT,
    ticket_price DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),
    other_expense DECIMAL(10, 2),
    plot_score INTEGER CHECK (plot_score BETWEEN 1 AND 5),
    visual_score INTEGER CHECK (visual_score BETWEEN 1 AND 5),
    acting_score INTEGER CHECK (acting_score BETWEEN 1 AND 5),
    script_score INTEGER CHECK (script_score BETWEEN 1 AND 5),
    singing_score INTEGER CHECK (singing_score BETWEEN 1 AND 5),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 演员评价表
CREATE TABLE actor_review (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID REFERENCES show(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artist(id) ON DELETE SET NULL,
    actor_order INTEGER,
    actor_type actor_type,
    role TEXT,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_show_musical_id ON show(musical_id);
CREATE INDEX idx_show_show_time ON show(show_time DESC);
CREATE INDEX idx_actor_review_show_id ON actor_review(show_id);
CREATE INDEX idx_actor_review_artist_id ON actor_review(artist_id);

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
