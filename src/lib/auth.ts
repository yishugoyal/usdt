import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'rupeebridge_super_secret_jwt_key_32bytes_min_length_2026'
);

export type AuthTokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface TokenPayload {
  userId?: string;
  staffId?: string;
  email: string;
  role?: string;
  type: 'USER' | 'STAFF';
  purpose?: AuthTokenPurpose;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }

  if (password.trim() !== password) {
    return { valid: false, message: 'Password cannot begin or end with whitespace.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must include at least one special character.' };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload, expiresIn = '24h'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('rb_user_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'USER' || !payload.userId) return null;
  return { id: payload.userId, email: payload.email };
}

export async function getCurrentStaff(): Promise<{ id: string; email: string; role: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('rb_staff_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.type !== 'STAFF' || !payload.staffId || !payload.role) return null;
  return { id: payload.staffId, email: payload.email, role: payload.role };
}
