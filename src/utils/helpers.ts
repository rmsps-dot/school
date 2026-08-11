import type { ApprovedResult } from '@/actions/portal-actions'

export function groupResultsByExam(results: ApprovedResult[]) {
  const map = new Map<ApprovedResult['exam_type'], ApprovedResult[]>()
  for (const r of results) {
    if (!map.has(r.exam_type)) map.set(r.exam_type, [])
    map.get(r.exam_type)!.push(r)
  }
  return map
}

export function calcGrade(pct: number): string {
  if (pct >= 91) return 'A1'
  if (pct >= 81) return 'A2'
  if (pct >= 71) return 'B1'
  if (pct >= 61) return 'B2'
  if (pct >= 51) return 'C1'
  if (pct >= 41) return 'C2'
  if (pct >= 33) return 'D'
  return 'E (Fail)'
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
