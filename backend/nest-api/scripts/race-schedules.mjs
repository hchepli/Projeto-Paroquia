// Prova as corridas (a), (c) e (d) com requisições paralelas reais.
// Uso (Node 20+), API local rodando e banco de dev:
//   API_URL=http://localhost:3000 TOKEN_ADMIN=<jwt> MASS_ID=1 PASTORAL_ID=2 \
//   VOL_A=10 VOL_B=11 VOL_C=12 node scripts/race-schedules.mjs
// Pré-requisitos: Missa MASS_ID FUTURA, com a pastoral PASTORAL_ID vinculada e SEM escala dessa pastoral;
// VOL_A/B/C = voluntários distintos da pastoral PASTORAL_ID.
const { API_URL = 'http://localhost:3000', TOKEN_ADMIN, MASS_ID, PASTORAL_ID, VOL_A, VOL_B, VOL_C } = process.env;
if (![TOKEN_ADMIN, MASS_ID, PASTORAL_ID, VOL_A, VOL_B, VOL_C].every(Boolean)) {
  console.error('Defina TOKEN_ADMIN, MASS_ID, PASTORAL_ID, VOL_A, VOL_B, VOL_C'); process.exit(1);
}
const call = async (method, path, body) => {
  const r = await fetch(API_URL + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN_ADMIN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const tally = (rs) => rs.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
const N = 8;
let failed = false;
const check = (name, ok, extra) => { console.log(`${ok ? 'OK  ' : 'FALHOU'} ${name}`, extra ?? ''); if (!ok) failed = true; };

// (a) N criações simultâneas para a mesma Missa/Pastoral -> exatamente 1x 201 e o resto 409
const mk = () => call('POST', '/schedules', {
  massId: Number(MASS_ID), pastoralGroupId: Number(PASTORAL_ID), assignments: [{ volunteerId: Number(VOL_A), role: 'leitor' }],
});
const a = await Promise.all(Array.from({ length: N }, mk));
const ta = tally(a);
check('(a) criação paralela da mesma escala', ta[201] === 1 && ta[409] === N - 1, ta);
const scheduleId = a.find((r) => r.status === 201)?.body?.id;
if (!scheduleId) process.exit(1);

// (c) mesma atribuição em paralelo -> 1x 201 e o resto 409 (UNIQUE case-insensitive via normalização)
const roles = ['Coroinha', 'coroinha', ' COROINHA ', 'coroinha'];
const c = await Promise.all(roles.map((role) => call('POST', '/schedule-assignment', { scheduleId, volunteerId: Number(VOL_B), role })));
const tc = tally(c);
check('(c) atribuição duplicada em paralelo', tc[201] === 1 && tc[409] === roles.length - 1, tc);

// (d) remover a escala enquanto outra pessoa adiciona atribuições -> nunca 500, estado final coerente
const d = await Promise.all([
  call('DELETE', `/schedules/${scheduleId}`),
  ...Array.from({ length: 4 }, () => call('POST', '/schedule-assignment', { scheduleId, volunteerId: Number(VOL_C), role: 'apoio' })),
]);
const td = tally(d);
check('(d) remoção x edição sem 500', !d.some((r) => r.status >= 500), td);
const after = await call('GET', `/schedules/${scheduleId}`);
check('(d) escala realmente removida', after.status === 404, after.status);

process.exit(failed ? 1 : 0);
