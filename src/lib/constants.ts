export const BELT_LIST = [
  '흰띠', '노란띠', '초록띠', '파란띠', '빨간띠', '검은띠',
] as const

export const REGION_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
] as const

export const ATTENDANCE_TYPES = ['출석', '결석', '조퇴'] as const

export const PLAN_LIST = ['free', 'basic', 'pro'] as const

export type Belt = typeof BELT_LIST[number]
export type Region = typeof REGION_LIST[number]
export type AttendanceType = typeof ATTENDANCE_TYPES[number]
export type Plan = typeof PLAN_LIST[number]
