import { createHmac, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'

const COOKIE_NAME = 'cip_session'

interface SessionPayload {
  userId: string
  exp: number
}

function secret() {
  return useRuntimeConfig().sessionSecret
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signSession(userId: string, days = 7) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + days * 86_400_000
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function readSession(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.userId || payload.exp < Date.now()) return null
    return payload
  }
  catch {
    return null
  }
}

export function setSessionCookie(event: Parameters<typeof setCookie>[0], userId: string) {
  setCookie(event, COOKIE_NAME, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  })
}

export function clearSessionCookie(event: Parameters<typeof setCookie>[0]) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function requireUser(event: Parameters<typeof getCookie>[0]) {
  const session = readSession(getCookie(event, COOKIE_NAME))
  if (!session) {
    throw createError({ statusCode: 401, message: 'Non authentifié' })
  }
  await connectDb()
  const user = await User.findById(session.userId).lean()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Session invalide' })
  }
  return user
}
