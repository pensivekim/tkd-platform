-- Step 30: Certification system - dan/poom/gup
-- 2026-03-10

ALTER TABLE students ADD COLUMN grade_type      TEXT    DEFAULT NULL; -- 'dan' | 'poom' | 'gup'
ALTER TABLE students ADD COLUMN dan_grade       INTEGER DEFAULT NULL; -- dan/poom: 1~9, gup: 1~9
ALTER TABLE students ADD COLUMN kukkiwon_id     TEXT    DEFAULT NULL; -- Kukkiwon registration number
ALTER TABLE students ADD COLUMN cert_number     TEXT    DEFAULT NULL; -- TKP-YYYY-[4char]-[4seq]
ALTER TABLE students ADD COLUMN cert_issued_at  TEXT    DEFAULT NULL; -- ISO date string
ALTER TABLE students ADD COLUMN nft_token_id    TEXT    DEFAULT NULL; -- Polygon NFT token ID
ALTER TABLE students ADD COLUMN nft_tx_hash     TEXT    DEFAULT NULL; -- Blockchain tx hash
ALTER TABLE students ADD COLUMN nft_issued_at   TEXT    DEFAULT NULL; -- NFT issue datetime

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_cert_number
  ON students (cert_number)
  WHERE cert_number IS NOT NULL;
