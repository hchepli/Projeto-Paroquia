// Caminho: src/app/api/health/route.ts
// Liveness do admin: só diz "o servidor Next está respondendo".
// Não chama a API (isso é o /health/ready do back).
// /api já fica fora do matcher do middleware, então não exige login.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
