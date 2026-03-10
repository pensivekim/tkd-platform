/**
 * Sentry captureException 래퍼.
 * NEXT_PUBLIC_SENTRY_DSN 없을 경우 console.error fallback.
 * @sentry/nextjs 설치 후 아래 주석 해제하여 활성화.
 */

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!dsn) {
    console.error('[captureException]', error, context ?? '')
    return
  }

  // @sentry/nextjs 활성화 시 아래 코드 사용:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.withScope((scope) => {
  //   if (context) scope.setExtras(context)
  //   Sentry.captureException(error)
  // })

  console.error('[Sentry] DSN set — captureException:', error, context ?? '')
}
