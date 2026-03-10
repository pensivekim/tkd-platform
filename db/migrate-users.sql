-- =============================================
-- TKD-PLATFORM: users 테이블 컬럼 추가 마이그레이션
-- 기존 users 테이블에 Layer 1 필수 컬럼 추가
-- 이미 존재하는 컬럼은 에러 발생 → 해당 줄 주석 처리 후 재실행
-- =============================================

ALTER TABLE users ADD COLUMN dojang_id TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff';
ALTER TABLE users ADD COLUMN dojang_name TEXT;
ALTER TABLE users ADD COLUMN dan_level INTEGER;
ALTER TABLE users ADD COLUMN country TEXT;
ALTER TABLE users ADD COLUMN messenger_id TEXT;
ALTER TABLE users ADD COLUMN messenger_type TEXT;
