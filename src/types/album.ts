export interface Album {
  id: string
  dojang_id: string
  title: string
  description: string | null
  event_date: string
  type: 'training' | 'competition'
  cover_r2_key: string | null
  photo_count: number
  share_token: string | null
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  album_id: string
  dojang_id: string
  r2_key: string
  student_id: string | null
  face_confidence: number | null
  classified_at: string | null
  is_confirmed: number
  sent_at: string | null
  created_at: string
}
