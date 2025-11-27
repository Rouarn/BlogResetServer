import type { Request } from 'express';
import type { Socket } from 'socket.io';

export function extractHttpToken(request: Request): string | null {
  const header = request.headers['authorization'];
  if (typeof header === 'string') {
    const [type, token] = header.split(' ');
    if (type === 'Bearer' && token) return token;
  }
  const custom = request.headers['x-auth-token'];
  if (Array.isArray(custom)) {
    const v = custom.find((x) => typeof x === 'string');
    return typeof v === 'string' ? v : null;
  }
  if (typeof custom === 'string') return custom;
  return null;
}

export function extractWsToken(client: Socket): string | null {
  const q = client.handshake.query;
  const tVal = q && (q as Record<string, unknown>).token;
  if (typeof tVal === 'string') return tVal;
  if (Array.isArray(tVal)) {
    const v = tVal.find((x) => typeof x === 'string');
    return typeof v === 'string' ? v : null;
  }
  const aVal = q && (q as Record<string, unknown>).auth;
  if (typeof aVal === 'string') return aVal;
  if (Array.isArray(aVal)) {
    const v = aVal.find((x) => typeof x === 'string');
    return typeof v === 'string' ? v : null;
  }
  const header = client.handshake.headers?.authorization;
  if (typeof header === 'string') {
    const [type, token] = header.split(' ');
    if (type === 'Bearer' && token) return token;
  }
  const custom = client.handshake.headers?.['x-auth-token'];
  if (Array.isArray(custom)) {
    const v = custom.find((x) => typeof x === 'string');
    return typeof v === 'string' ? v : null;
  }
  if (typeof custom === 'string') return custom;
  return null;
}
