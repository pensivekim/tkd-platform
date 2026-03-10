import type { AttendanceType } from '@/lib/constants'

export interface Attendance {
  id: string
  dojang_id: string
  student_id: string
  checked_at: string
  type: AttendanceType
  memo: string | null
}

export interface AttendanceWithStudent extends Attendance {
  student_name: string
  student_belt: string
}
