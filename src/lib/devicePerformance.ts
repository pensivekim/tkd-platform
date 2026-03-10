export interface DevicePerformance {
  tier: 'high' | 'mid' | 'low';
  modelComplexity: 0 | 1 | 2;
  videoConstraints: { width: number; height: number; frameRate: number };
}

export function getDevicePerformance(): DevicePerformance {
  if (typeof navigator === 'undefined') {
    return { tier: 'mid', modelComplexity: 1, videoConstraints: { width: 480, height: 360, frameRate: 24 } };
  }
  const cores  = navigator.hardwareConcurrency ?? 2;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 2;

  if (cores >= 8 && memory >= 8) {
    return { tier: 'high', modelComplexity: 2, videoConstraints: { width: 640, height: 480, frameRate: 30 } };
  } else if (cores >= 4 && memory >= 4) {
    return { tier: 'mid',  modelComplexity: 1, videoConstraints: { width: 480, height: 360, frameRate: 24 } };
  } else {
    return { tier: 'low',  modelComplexity: 0, videoConstraints: { width: 320, height: 240, frameRate: 15 } };
  }
}

export const TIER_LABEL: Record<DevicePerformance['tier'], string> = {
  high: '고성능 모드',
  mid:  '균형 모드',
  low:  '절전 모드',
};
