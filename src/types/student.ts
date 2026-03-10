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
}
