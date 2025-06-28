-- Performance Optimization Indexes
-- This migration adds indexes to improve query performance for the dashboard

-- Composite index for bookmark queries (user_id + created_at)
-- This will speed up "get user bookmarks ordered by date" queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created 
ON bookmarks(user_id, created_at DESC);

-- Covering index for bookmark + tool basic info
-- This allows the database to satisfy bookmark queries without additional lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_with_tool_info 
ON bookmarks(user_id) 
INCLUDE (tool_id, created_at);

-- Composite index for tools filtering
CREATE INDEX IF NOT EXISTS idx_tools_category_featured 
ON tools(category, featured, rating DESC);

-- Index for tools search functionality
CREATE INDEX IF NOT EXISTS idx_tools_search 
ON tools USING gin(to_tsvector('english', name || ' ' || description));

-- Index for tools by pricing
CREATE INDEX IF NOT EXISTS idx_tools_pricing_rating 
ON tools(pricing, rating DESC);

-- Partial index for featured tools only
CREATE INDEX IF NOT EXISTS idx_tools_featured_only 
ON tools(rating DESC, created_at DESC) 
WHERE featured = true;

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
ON reviews(user_id, created_at DESC);

-- Index for tool reviews (for calculating averages)
CREATE INDEX IF NOT EXISTS idx_reviews_tool_rating 
ON reviews(tool_id, rating);

-- Composite index for user profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email) 
WHERE email IS NOT NULL;

-- Index for tools by verification status
CREATE INDEX IF NOT EXISTS idx_tools_verified 
ON tools(verified, rating DESC) 
WHERE verified = true;

-- Analyze tables to update statistics
ANALYZE bookmarks;
ANALYZE tools;
ANALYZE reviews;
ANALYZE profiles;

-- Add comments for documentation
COMMENT ON INDEX idx_bookmarks_user_created IS 'Optimizes user bookmark queries ordered by creation date';
COMMENT ON INDEX idx_bookmarks_with_tool_info IS 'Covering index for bookmark queries with tool info';
COMMENT ON INDEX idx_tools_category_featured IS 'Optimizes tool filtering by category and featured status';
COMMENT ON INDEX idx_tools_search IS 'Full-text search index for tool names and descriptions';
COMMENT ON INDEX idx_tools_pricing_rating IS 'Optimizes tool filtering by pricing and rating';
COMMENT ON INDEX idx_tools_featured_only IS 'Partial index for featured tools queries';
COMMENT ON INDEX idx_reviews_user_created IS 'Optimizes user review queries';
COMMENT ON INDEX idx_reviews_tool_rating IS 'Optimizes tool rating calculations';
COMMENT ON INDEX idx_profiles_email IS 'Optimizes profile lookups by email';
COMMENT ON INDEX idx_tools_verified IS 'Partial index for verified tools';

-- Create a function to monitor query performance
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  rows bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.rows
  FROM pg_stat_statements
  WHERE pg_stat_statements.mean_exec_time > 100 -- Queries taking more than 100ms
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
  table_name text,
  size_pretty text,
  row_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
    n_tup_ins - n_tup_del as row_count
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to analyze bookmark query performance
CREATE OR REPLACE FUNCTION analyze_bookmark_performance(user_uuid uuid)
RETURNS TABLE(
  query_type text,
  execution_time_ms numeric,
  rows_returned bigint,
  index_used text
) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  row_count bigint;
BEGIN
  -- Test basic bookmark query
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM bookmarks b
  JOIN tools t ON b.tool_id = t.id
  WHERE b.user_id = user_uuid;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'basic_bookmark_query'::text,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::numeric,
    row_count,
    'idx_bookmarks_user_created'::text;
    
  -- Test bookmark query with tool details
  start_time := clock_timestamp();
  
  SELECT COUNT(*) INTO row_count
  FROM bookmarks b
  JOIN tools t ON b.tool_id = t.id
  WHERE b.user_id = user_uuid
  ORDER BY b.created_at DESC;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'bookmark_with_tools'::text,
    EXTRACT(MILLISECONDS FROM (end_time - start_time))::numeric,
    row_count,
    'idx_bookmarks_user_created + idx_tools_*'::text;
    
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_slow_queries() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_bookmark_performance(uuid) TO authenticated;

-- Create a view for dashboard performance metrics
CREATE OR REPLACE VIEW dashboard_performance_metrics AS
SELECT 
  'bookmarks' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 86400 as avg_age_days
FROM bookmarks
UNION ALL
SELECT 
  'tools' as table_name,
  COUNT(*) as total_records,
  0 as unique_users,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 86400 as avg_age_days
FROM tools
UNION ALL
SELECT 
  'reviews' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 86400 as avg_age_days
FROM reviews;

-- Grant access to the view
GRANT SELECT ON dashboard_performance_metrics TO authenticated;

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully';
  RAISE NOTICE 'Use SELECT * FROM get_slow_queries() to monitor query performance';
  RAISE NOTICE 'Use SELECT * FROM get_table_sizes() to monitor table sizes';
  RAISE NOTICE 'Use SELECT * FROM dashboard_performance_metrics for overview';
END $$;