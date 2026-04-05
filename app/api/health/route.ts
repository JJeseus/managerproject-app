import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'managerproject-app',
    status: 'up',
    timestamp: new Date().toISOString(),
  })
}
