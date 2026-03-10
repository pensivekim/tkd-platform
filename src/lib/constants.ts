export const BELT_LIST = [
  '흰띠', '노란띠', '초록띠', '파란띠', '빨간띠', '검은띠',
] as const

// 단/품/급 체계
// 단(Dan): 만 15세 이상 검은띠 1~9단
// 품(Poom): 만 15세 미만 검은띠 1~3품 (만 15세 되면 단으로 전환 가능)
// 급(Gup): 색띠 1~9급
export const GRADE_TYPES = [
  { value: 'dan',  label: '단', labelEn: 'Dan',  min: 1, max: 9 },
  { value: 'poom', label: '품', labelEn: 'Poom', min: 1, max: 3 },
  { value: 'gup',  label: '급', labelEn: 'Gup',  min: 1, max: 9 },
] as const

export type GradeType = typeof GRADE_TYPES[number]['value']

// 단증 번호 생성 유틸
// 형식: TKP-[연도]-[도장코드 4자리]-[일련번호 4자리]
// 예: TKP-2026-A1B2-0001
export function generateCertNumber(dojangId: string, sequence: number): string {
  const year = new Date().getFullYear()
  const code = dojangId.slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X').padEnd(4, 'X')
  const seq  = String(sequence).padStart(4, '0')
  return `TKP-${year}-${code}-${seq}`
}

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
