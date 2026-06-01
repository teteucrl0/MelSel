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

export function hasRole(role) {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const p = parseJwt(token);
  if (!p || !p.roles) return false;
  return p.roles.some(r => r === role || r === `ROLE_${role}`);
}

export function getUsername() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const p = parseJwt(token);
  return p ? p.sub || p.username || null : null;
}
