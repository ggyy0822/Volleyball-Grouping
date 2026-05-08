const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};
 
function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {...jsonHeaders, ...(init.headers || {})}
  });
}
 
function keyForDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  return `roster:${date}`;
}
 
export async function onRequestGet({request, env}) {
  const url = new URL(request.url);
  const key = keyForDate(url.searchParams.get('date'));
  if (!key) return json({error: 'Invalid date'}, {status: 400});
 
  const raw = await env.VOLLEYBALL_KV.get(key);
  if (!raw) return json({players: [], bindGroups: [], nextId: 0});
 
  try {
    return json(JSON.parse(raw));
  } catch (_) {
    return json({players: [], bindGroups: [], nextId: 0});
  }
}
 
export async function onRequestPut({request, env}) {
  const url = new URL(request.url);
  const key = keyForDate(url.searchParams.get('date'));
  if (!key) return json({error: 'Invalid date'}, {status: 400});
 
  const body = await request.json();
  const roster = {
    players: Array.isArray(body.players) ? body.players : [],
    bindGroups: Array.isArray(body.bindGroups) ? body.bindGroups : [],
    nextId: Number.isFinite(body.nextId) ? body.nextId : 0,
    teams: Array.isArray(body.teams) ? body.teams : [],
    payments: (body.payments && typeof body.payments === 'object' && !Array.isArray(body.payments)) ? body.payments : {},
    groupResult: Array.isArray(body.groupResult) ? body.groupResult : null,
    confirmedGroups: Array.isArray(body.confirmedGroups) ? body.confirmedGroups : [],
    updatedAt: new Date().toISOString()
  };
 
  await env.VOLLEYBALL_KV.put(key, JSON.stringify(roster));
  return json({ok: true, updatedAt: roster.updatedAt});
}
