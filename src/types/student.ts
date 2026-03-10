export interface Student {
  id: string
  dojang_id: string
  name: string
  birth_date: string | null
  phone: string | null
  parent_phone: string | null
  belt: string
  dan: string | null
  joined_at: string
  status: 'active' | 'inactive'
  memo: string | null
  created_at: string
  updated_at: string
  face_r2_key: string | null
  face_embedding: string | null
  // Certification fields (Step 30)
  grade_type:     'dan' | 'poom' | 'gup' | null
  dan_grade:      number | null
  kukkiwon_id:    string | null
  cert_number:    string | null
  cert_issued_at: string | null
  nft_token_id:   string | null
  nft_tx_hash:    string | null
  nft_issued_at:  string | null
}
