import { NextRequest } from 'next/server';

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin_session');
  return !!cookie?.value && cookie.value === process.env.ADMIN_PASSWORD;
}
