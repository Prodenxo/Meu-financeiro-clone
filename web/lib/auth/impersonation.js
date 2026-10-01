import 'server-only';
import { cookies } from 'next/headers';

/**
 * "Acessar como" (impersonação) — porta do `authStore.impersonate` do app atual.
 * Lá a sessão do admin ficava guardada em memória; aqui fica num cookie httpOnly
 * só com os tokens necessários para o `setSession` de volta. Nunca vai para o cliente.
 */
export const ADMIN_BACKUP_COOKIE = 'mf-admin-backup';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function saveAdminBackup({ accessToken, refreshToken, adminName, targetName }) {
  const store = await cookies();
  store.set(
    ADMIN_BACKUP_COOKIE,
    JSON.stringify({ at: accessToken, rt: refreshToken, an: adminName || '', tn: targetName || '' }),
    cookieOptions(),
  );
}

/** @returns {{ accessToken: string, refreshToken: string, adminName: string, targetName: string } | null} */
export async function readAdminBackup() {
  const store = await cookies();
  const raw = store.get(ADMIN_BACKUP_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.at || !parsed?.rt) return null;
    return { accessToken: parsed.at, refreshToken: parsed.rt, adminName: parsed.an || '', targetName: parsed.tn || '' };
  } catch {
    return null;
  }
}

export async function clearAdminBackup() {
  const store = await cookies();
  store.set(ADMIN_BACKUP_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

/** Só o que o banner precisa saber (sem tokens). */
export async function getImpersonationInfo() {
  const backup = await readAdminBackup();
  if (!backup) return null;
  return { adminName: backup.adminName, targetName: backup.targetName };
}
