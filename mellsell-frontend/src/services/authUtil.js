export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      // Node fallback (not used in browser)
      const base64Url = token.split('.')[1];
      const buff = Buffer.from(base64Url.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      return JSON.parse(buff.toString('utf-8'));
    } catch (err) {
      return null;
    }
  }
}

export function getRoles() {
  const stored = localStorage.getItem('roles');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  const token = localStorage.getItem('token');
  if (!token) return [];
  const p = parseJwt(token);
  if (!p || !p.roles) return [];
  return Array.isArray(p.roles) ? p.roles : [p.roles];
}

export function setRoles(roles) {
  if (!roles || !roles.length) {
    localStorage.removeItem('roles');
    return;
  }
  const normalized = roles.map((r) => String(r).replace(/^ROLE_/, ''));
  localStorage.setItem('roles', JSON.stringify(normalized));
  window.dispatchEvent(new Event('mellsell-roles-updated'));
}

export function hasRole(role) {
  const roles = getRoles();
  if (!roles.length) return false;
  return roles.some((r) => r === role || r === `ROLE_${role}`);
}

function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

function nameFromUserJson() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const candidate = u.displayName || u.name;
    if (candidate && !looksLikeEmail(candidate)) return candidate;
  } catch {
    /* ignore */
  }
  return null;
}

/** Nome exibido no header — nunca o e-mail. */
export function getDisplayName() {
  const stored = localStorage.getItem('displayName');
  if (stored && !looksLikeEmail(stored)) return stored;

  const fromUser = nameFromUserJson();
  if (fromUser) return fromUser;

  const token = localStorage.getItem('token');
  if (!token) return null;
  const p = parseJwt(token);
  if (!p) return null;

  const fromToken = p.displayName || p.name;
  if (fromToken && !looksLikeEmail(fromToken)) return fromToken;

  return null;
}

/** @deprecated Use getDisplayName */
export function getUsername() {
  return getDisplayName();
}

/** Para onde enviar após login conforme papel (comprador, apicultor, admin). */
export function resolvePostLoginPath(loginResponse, fallbackPath = '/') {
  const raw = loginResponse?.roles
  const roles = raw
    ? Array.isArray(raw)
      ? raw
      : [...raw]
    : getRoles()
  const normalized = roles.map((r) => String(r).replace(/^ROLE_/, ''))
  if (normalized.includes('ADMIN')) return '/admin/dashboard'
  if (normalized.includes('VENDEDOR')) return '/vendor/dashboard'
  const safe =
    fallbackPath && fallbackPath !== '/login' && !fallbackPath.startsWith('/register')
      ? fallbackPath
      : '/'
  return safe
}
