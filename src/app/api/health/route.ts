import { captureException } from '@/lib/sentry'

export async function GET() {
  try {
    const envOk = !!process.env.JWT_SECRET

    return Response.json({
      status: 'ok',
      service: 'dojangwan',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        env: envOk ? 'ok' : 'error',
      },
    })
  } catch (error) {
    captureException(error, { route: '/api/health' })
    return Response.json(
      {
        status: 'error',
        service: 'dojangwan',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error',
          env: 'error',
        },
      },
      { status: 500 },
    )
  }
}
