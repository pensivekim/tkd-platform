export interface Notice {
  id: string
  dojang_id: string
  title: string
  content: string
  is_pinned: number   // SQLite INTEGER: 0 | 1
  created_at: string
  updated_at: string
}
