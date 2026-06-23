export function getCleanDomain(domain) {
  // Remove protocol
  let clean = domain.replace(/^https?:\/\//, '');
  // Remove trailing slash if any
  clean = clean.replace(/\/$/, '');
  return clean;
}

export function constructUrl(currentUrlString, targetDomain) {
  if (!currentUrlString) return null;
  
  let currentUrl;
  try {
    currentUrl = new URL(currentUrlString);
  } catch (e) {
    return null;
  }

  const cleanTarget = getCleanDomain(targetDomain);
  if (!cleanTarget) return null;

  // Determine protocol: if localhost, 127.x, or contains port without a dot (e.g. dev:3000), default to http.
  // Otherwise https.
  const isLocal = cleanTarget.startsWith('localhost') || 
                  /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(cleanTarget) || 
                  (cleanTarget.includes(':') && !cleanTarget.includes('.'));
                  
  const protocol = isLocal ? 'http:' : 'https:';
  
  return `${protocol}//${cleanTarget}${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
}

export function findActiveProject(projects, currentUrlString) {
  if (!currentUrlString || !projects || projects.length === 0) return null;
  
  let currentUrl;
  try {
    currentUrl = new URL(currentUrlString);
  } catch (e) {
    return null;
  }
  
  const host = currentUrl.host;
  
  for (const p of projects) {
    for (const e of p.envs) {
      if (!e.domain) continue;
      const cleanDomain = getCleanDomain(e.domain);
      // exact match or subdomain match
      if (host === cleanDomain || host.endsWith('.' + cleanDomain)) {
        return p.id;
      }
    }
  }
  return null;
}
