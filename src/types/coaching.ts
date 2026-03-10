export interface CoachingSession {
  id:               string
  dojang_id:        string
  coach_id:         string
  title:            string
  description:      string | null
  type:             'individual' | 'group'
  status:           'waiting' | 'active' | 'ended'
  invite_token:     string
  max_participants: number
  started_at:       string | null
  ended_at:         string | null
  created_at:       string
}

export interface CoachingParticipant {
  id:           string
  session_id:   string
  student_id:   string | null
  peer_id:      string
  display_name: string
  joined_at:    string
  left_at:      string | null
}

export interface CoachingSignal {
  id:         string
  session_id: string
  from_peer:  string
  to_peer:    string
  type:       'offer' | 'answer' | 'ice-candidate'
  payload:    string
  created_at: string
}
