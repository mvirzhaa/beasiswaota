import { headers } from "next/headers";

/**
 * IP dan user agent pemanggil Server Action, dibaca dari header yang
 * diteruskan Nginx (CLAUDE.md: VPS di belakang reverse proxy). Dipakai
 * untuk melengkapi AuditLog (aturan keras #6: aktor, IP, snapshot).
 */
export async function ambilMetaPermintaan(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
  const userAgent = hdrs.get("user-agent");
  return { ipAddress, userAgent };
}
