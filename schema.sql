-- ==============================================================================
-- THE SANGSAN: ZERO-COST HIGH-TRAFFIC REAL-TIME BROADCAST SYSTEM
-- Database Schema: Supabase PostgreSQL (schema.sql)
-- Target: 1,000 CCU, Zero Connection Exhaustion, RLS Secured
-- ==============================================================================

-- 1. Create match_logs table
CREATE TABLE IF NOT EXISTS public.match_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    sport_type VARCHAR(32) NOT NULL DEFAULT 'soccer', -- soccer, basketball, dodgeball, relay
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'LIVE', 'PAUSED', 'FINISHED'
    period VARCHAR(32) NOT NULL DEFAULT '1st Half', -- '1st Half', '2nd Half', 'Overtime', 'Final'
    elapsed_seconds INT NOT NULL DEFAULT 0,
    home_team VARCHAR(64) NOT NULL,
    away_team VARCHAR(64) NOT NULL,
    home_score INT NOT NULL DEFAULT 0,
    away_score INT NOT NULL DEFAULT 0,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for High-Traffic Read Optimization
-- Single-row hot path index for Edge API read
CREATE INDEX IF NOT EXISTS idx_match_logs_active_updated 
    ON public.match_logs (is_active, updated_at DESC) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_match_logs_match_id 
    ON public.match_logs (match_id);

-- GIN Index for fast JSONB querying if event filtering is needed
CREATE INDEX IF NOT EXISTS idx_match_logs_events_gin 
    ON public.match_logs USING gin (events);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_match_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_logs_timestamp ON public.match_logs;
CREATE TRIGGER trg_match_logs_timestamp
    BEFORE UPDATE ON public.match_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_match_logs_timestamp();

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE public.match_logs ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous read access only for active matches
DROP POLICY IF EXISTS "Public anonymous read access for active matches" ON public.match_logs;
CREATE POLICY "Public anonymous read access for active matches" 
    ON public.match_logs 
    FOR SELECT 
    TO anon, authenticated
    USING (is_active = true);

-- Strict write access: Service Role only (or authenticated admin via secret key)
DROP POLICY IF EXISTS "Service role exclusive write access" ON public.match_logs;
CREATE POLICY "Service role exclusive write access" 
    ON public.match_logs 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 5. Seed Mock Data for Sangsan High School Championship Match
INSERT INTO public.match_logs (
    match_id,
    title,
    sport_type,
    status,
    period,
    elapsed_seconds,
    home_team,
    away_team,
    home_score,
    away_score,
    is_active,
    events
) VALUES (
    'final-soccer-2026',
    '제45회 상산체전 축구 결승전 (2학년 3반 vs 2학년 4반)',
    'soccer',
    'LIVE',
    '2nd Half',
    2140,
    '2학년 3반 (White Dragons)',
    '2학년 4반 (Red Phoenix)',
    2,
    1,
    true,
    '[
        {
            "id": "evt-01",
            "minute": 14,
            "type": "GOAL",
            "team": "home",
            "player": "20305 김민준",
            "description": "아크 정면에서 환상적인 오른발 중거리 감아차기 선제골!",
            "timestamp": "2026-09-07T14:14:20Z"
        },
        {
            "id": "evt-02",
            "minute": 32,
            "type": "YELLOW_CARD",
            "team": "away",
            "player": "20412 이준서",
            "description": "역습 저지 중 위험한 태클로 옐로카드 경고",
            "timestamp": "2026-09-07T14:32:15Z"
        },
        {
            "id": "evt-03",
            "minute": 41,
            "type": "GOAL",
            "team": "away",
            "player": "20409 박도현",
            "description": "코너킥 세트피스 상황에서 러닝 헤더 동점골 성공!",
            "timestamp": "2026-09-07T14:41:50Z"
        },
        {
            "id": "evt-04",
            "minute": 58,
            "type": "GOAL",
            "team": "home",
            "player": "20311 정우진",
            "description": "측면 컷백 크로스를 침착하게 골문 구석으로 밀어 넣어 추가골!",
            "timestamp": "2026-09-07T14:58:30Z"
        }
    ]'::jsonb
) ON CONFLICT (match_id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    period = EXCLUDED.period,
    elapsed_seconds = EXCLUDED.elapsed_seconds,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    events = EXCLUDED.events,
    updated_at = timezone('utc'::text, now());
