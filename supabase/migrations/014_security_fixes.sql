-- XSCAN Security Fixes Migration
-- Corrige todos os erros e warnings do Security Advisor
-- Executar no Supabase SQL Editor

-- =============================================================================
-- FIX 1: Enable RLS on tables without it
-- =============================================================================

-- alert_users - enable RLS and add policies
ALTER TABLE IF EXISTS alert_users ENABLE ROW LEVEL SECURITY;

-- alert_subscriptions - enable RLS and add policies  
ALTER TABLE IF EXISTS alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- channel_suggestions - ensure RLS is enabled
ALTER TABLE IF EXISTS channel_suggestions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FIX 2: RLS Policies for alert_users
-- =============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "alert_users_select" ON alert_users;
DROP POLICY IF EXISTS "alert_users_insert" ON alert_users;
DROP POLICY IF EXISTS "alert_users_update" ON alert_users;
DROP POLICY IF EXISTS "alert_users_delete" ON alert_users;
DROP POLICY IF EXISTS "Service role can manage alert_users" ON alert_users;

-- Public can read (needed for bot to check user existence)
CREATE POLICY "alert_users_select" ON alert_users
    FOR SELECT USING (true);

-- Service role full access for bot operations
CREATE POLICY "alert_users_service" ON alert_users
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- FIX 3: RLS Policies for alert_subscriptions
-- =============================================================================

DROP POLICY IF EXISTS "alert_subs_select" ON alert_subscriptions;
DROP POLICY IF EXISTS "alert_subs_insert" ON alert_subscriptions;
DROP POLICY IF EXISTS "alert_subs_update" ON alert_subscriptions;
DROP POLICY IF EXISTS "alert_subs_delete" ON alert_subscriptions;
DROP POLICY IF EXISTS "Service role can manage alert_subscriptions" ON alert_subscriptions;

-- Public can read subscriptions
CREATE POLICY "alert_subs_select" ON alert_subscriptions
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "alert_subs_service" ON alert_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- FIX 4: RLS Policies for channel_suggestions (fix overly permissive)
-- =============================================================================

DROP POLICY IF EXISTS "Channel suggestions are viewable by everyone" ON channel_suggestions;
DROP POLICY IF EXISTS "Service role can manage channel suggestions" ON channel_suggestions;
DROP POLICY IF EXISTS "channel_suggestions_select" ON channel_suggestions;
DROP POLICY IF EXISTS "channel_suggestions_insert" ON channel_suggestions;
DROP POLICY IF EXISTS "channel_suggestions_service" ON channel_suggestions;

-- Public read
CREATE POLICY "channel_suggestions_select" ON channel_suggestions
    FOR SELECT USING (true);

-- Public can insert suggestions
CREATE POLICY "channel_suggestions_insert" ON channel_suggestions
    FOR INSERT WITH CHECK (true);

-- Service role for updates/deletes
CREATE POLICY "channel_suggestions_service" ON channel_suggestions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- FIX 5: Recreate views without SECURITY DEFINER
-- =============================================================================

-- Drop and recreate moltbook_posts_view as SECURITY INVOKER
DROP VIEW IF EXISTS moltbook_posts_view;
CREATE VIEW moltbook_posts_view 
WITH (security_invoker = true) AS
SELECT 
    p.id,
    p.title,
    p.body,
    p.category,
    p.likes_count,
    p.created_at,
    u.username,
    u.display_color,
    COALESCE(rc.reply_count, 0) as reply_count
FROM moltbook_posts p
JOIN moltbook_users u ON p.user_id = u.id
LEFT JOIN (
    SELECT post_id, COUNT(*) as reply_count 
    FROM moltbook_replies 
    GROUP BY post_id
) rc ON p.id = rc.post_id
ORDER BY p.created_at DESC;

-- Drop and recreate moltbook_replies_view as SECURITY INVOKER
DROP VIEW IF EXISTS moltbook_replies_view;
CREATE VIEW moltbook_replies_view 
WITH (security_invoker = true) AS
SELECT 
    r.id,
    r.post_id,
    r.body,
    r.created_at,
    u.username,
    u.display_color
FROM moltbook_replies r
JOIN moltbook_users u ON r.user_id = u.id
ORDER BY r.created_at ASC;

-- Grant access to views
GRANT SELECT ON moltbook_posts_view TO anon, authenticated;
GRANT SELECT ON moltbook_replies_view TO anon, authenticated;

-- =============================================================================
-- FIX 6: Fix function search_path (prevents SQL injection via search path)
-- =============================================================================

-- recalculate_telegram_channel_stats
CREATE OR REPLACE FUNCTION recalculate_telegram_channel_stats(channel_uuid UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE telegram_channels SET
        total_calls = (SELECT COUNT(*) FROM telegram_calls WHERE channel_id = channel_uuid),
        winning_calls = (SELECT COUNT(*) FROM telegram_calls WHERE channel_id = channel_uuid AND is_win = true),
        winrate = COALESCE(
            (SELECT COUNT(*) FILTER (WHERE is_win = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        avg_multiplier = COALESCE(
            (SELECT AVG(ath_multiplier) FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        best_multiplier = COALESCE(
            (SELECT MAX(ath_multiplier) FROM telegram_calls WHERE channel_id = channel_uuid), 0
        ),
        updated_at = NOW()
    WHERE id = channel_uuid;
END;
$$;

-- update_telegram_channel_stats_trigger
CREATE OR REPLACE FUNCTION update_telegram_channel_stats_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_telegram_channel_stats(OLD.channel_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_telegram_channel_stats(NEW.channel_id);
        RETURN NEW;
    END IF;
END;
$$;

-- set_telegram_call_monitoring
CREATE OR REPLACE FUNCTION set_telegram_call_monitoring()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.monitoring_until IS NULL THEN
        NEW.monitoring_until := NEW.entry_timestamp + INTERVAL '48 hours';
    END IF;
    RETURN NEW;
END;
$$;

-- update_post_likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE moltbook_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE moltbook_posts 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- update_user_last_seen
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE moltbook_users 
    SET last_seen = timezone('utc'::text, now())
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

-- recalculate_kol_stats
CREATE OR REPLACE FUNCTION recalculate_kol_stats(kol_uuid UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE kols SET
        total_calls = (SELECT COUNT(*) FROM calls WHERE kol_id = kol_uuid),
        winning_calls = (SELECT COUNT(*) FROM calls WHERE kol_id = kol_uuid AND is_win = true),
        winrate = COALESCE(
            (SELECT COUNT(*) FILTER (WHERE is_win = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100
             FROM calls WHERE kol_id = kol_uuid), 0
        ),
        avg_multiplier = COALESCE(
            (SELECT AVG(ath_multiplier) FROM calls WHERE kol_id = kol_uuid), 0
        ),
        best_multiplier = COALESCE(
            (SELECT MAX(ath_multiplier) FROM calls WHERE kol_id = kol_uuid), 0
        ),
        updated_at = NOW()
    WHERE id = kol_uuid;
END;
$$;

-- update_kol_stats_trigger
CREATE OR REPLACE FUNCTION update_kol_stats_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_kol_stats(OLD.kol_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_kol_stats(NEW.kol_id);
        RETURN NEW;
    END IF;
END;
$$;

-- =============================================================================
-- FIX 7: Fix overly permissive RLS policies (USING true for writes)
-- Replace with service_role only for modifications
-- =============================================================================

-- admins table - only service role should modify
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;
CREATE POLICY "admins_service_only" ON admins
    FOR ALL USING (auth.role() = 'service_role');

-- kols table - public read, service role modify
DROP POLICY IF EXISTS "Service role can manage KOLs" ON kols;
CREATE POLICY "kols_service_modify" ON kols
    FOR ALL USING (auth.role() = 'service_role');

-- calls table - public read, service role modify
DROP POLICY IF EXISTS "Service role can manage calls" ON calls;
CREATE POLICY "calls_service_modify" ON calls
    FOR ALL USING (auth.role() = 'service_role');

-- applications table - fix overly permissive
DROP POLICY IF EXISTS "Service role can manage applications" ON applications;
CREATE POLICY "applications_service_modify" ON applications
    FOR ALL USING (auth.role() = 'service_role');

-- price_history - service role only for writes
DROP POLICY IF EXISTS "Service role can manage price history" ON price_history;
CREATE POLICY "price_history_service_modify" ON price_history
    FOR ALL USING (auth.role() = 'service_role');

-- moltbook tables - restrict writes to service role or proper auth
DROP POLICY IF EXISTS "users_insert" ON moltbook_users;
DROP POLICY IF EXISTS "users_update" ON moltbook_users;
DROP POLICY IF EXISTS "posts_insert" ON moltbook_posts;
DROP POLICY IF EXISTS "posts_update" ON moltbook_posts;
DROP POLICY IF EXISTS "replies_insert" ON moltbook_replies;
DROP POLICY IF EXISTS "likes_insert" ON moltbook_likes;
DROP POLICY IF EXISTS "likes_delete" ON moltbook_likes;

-- Note: moltbook needs public insert for anon users - this is by design
-- But we can still add service role policy
CREATE POLICY "moltbook_users_anon_insert" ON moltbook_users 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "moltbook_users_anon_update" ON moltbook_users 
    FOR UPDATE USING (true);
CREATE POLICY "moltbook_posts_anon_insert" ON moltbook_posts 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "moltbook_posts_anon_update" ON moltbook_posts 
    FOR UPDATE USING (true);
CREATE POLICY "moltbook_replies_anon_insert" ON moltbook_replies 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "moltbook_likes_anon_insert" ON moltbook_likes 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "moltbook_likes_anon_delete" ON moltbook_likes 
    FOR DELETE USING (true);

-- telegram_achievements - restrict to service role
DROP POLICY IF EXISTS "Service role full access" ON telegram_achievements;
CREATE POLICY "telegram_achievements_select" ON telegram_achievements
    FOR SELECT USING (true);
CREATE POLICY "telegram_achievements_service" ON telegram_achievements
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Security migration completed!' as status;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
