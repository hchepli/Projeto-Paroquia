# Roadmap — Filtros, Busca e Ordenação (+ Dia 0 de Regressão)

Repositório: https://github.com/hchepli/nest-api
Pré-requisito: Roadmap de Upload de Fotos (roadmap-upload-fotos.md) concluído — Dias 0-5.

Cada dia abaixo é um prompt pronto pra colar no início da sessão. Cole o prompt do dia, cole o resultado dos comandos de teste quando eu pedir, e seguimos.

> **Regra deste roadmap**: se o Dia 0 (regressão) encontrar qualquer teste quebrado do bloco de Auth ou de Upload de Fotos, a gente PARA aqui, volta pra conversa/sessão correspondente àquele bloco, corrige lá, e só depois retoma o Dia 1 deste roadmap.

---

## Dia 0 — Regressão completa (Auth + Storage + Photos + Albums)

Sem feature nova. Só rodar tudo que já foi implementado, com o Postgres/Docker de pé, e confirmar que nada quebrou antes de abrir a frente de Filtros/Paginação.

```
Antes de começarmos Filtros/Busca/Ordenação, preciso rodar uma bateria de
regressão em tudo que já foi feito nos roadmaps de Auth e Upload de Fotos.

Não implementar nada novo hoje — só rodar os testes abaixo e me ajudar a
diagnosticar qualquer coisa que não passar.
```

### Checklist de regressão

**1. Banco e seed**
```bash
npx prisma migrate dev
npx prisma db seed
```
- [ ] Seed roda sem erro
- [ ] `npx prisma studio` mostra os dados esperados (2 pastorais, 3 usuários com cargos certos, 2 missas, 2 eventos, 2 escalas, 2 comunicados, 1 sacramento, 2 álbuns, 2 fotos)

**2. Auth (login + JWT + RBAC)**
```bash
# Login válido (usuário do seed)
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@paroquia.org\",\"password\":\"senha12345\"}"
```
- [ ] Retorna `access_token`
- [ ] Login com senha errada → 401 genérico
- [ ] Rota protegida sem token (ex: `GET /users`) → 401
- [ ] Rota protegida com token válido → 200
- [ ] Rota pública sem token (ex: `GET /events`) → 200
- [ ] Coordenador de Pastoral só vê/edita escalas da própria pastoral (RN006/RN008)

**3. Upload de fotos (Cloudinary)**
```bash
# Upload válido
curl -X POST http://localhost:3000/photos \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -F "albumId=1" \
  -F "isCover=true" \
  -F "file=@/caminho/para/foto-valida.jpg"
```
- [ ] Upload válido (JPEG/PNG/WEBP, <5MB) → 201, URL do Cloudinary retornada
- [ ] Conferir na Cloudinary que a imagem chegou **redimensionada/comprimida** (RNF009 — sharp), não o arquivo original bruto
- [ ] Upload de tipo não permitido (ex: .pdf) → 400, sem subir pro Cloudinary
- [ ] Upload maior que 5MB → 400
- [ ] `GET /photos` e `GET /photos/:id` funcionam sem token (`@Public()`)

**4. Remoção em cascata (Dia 4 do roadmap de upload)**
- [ ] Remover uma Photo avulsa → registro some do banco E arquivo some da Cloudinary
- [ ] Remover um Album inteiro com Photos → todas as Photos somem do banco E da Cloudinary
- [ ] RN010 (capa única por álbum) continua bloqueando 2 fotos com `isCover: true` no mesmo álbum

**5. Regras de negócio críticas (já implementadas antes do bloco de upload)**
- [ ] RN007 (Schedule XOR Mass/Event) ainda bloqueia vínculo duplo ou vazio
- [ ] RN016 (excluir Mass/Event com Schedule vinculada exige confirmação) — se já implementado; se não, anotar como pendência
- [ ] UC003 (não deixar inativar o último Admin Geral ativo) — já implementado no `UsersService`, confirmar que continua bloqueando

### Se algo falhar

Não seguir para o Dia 1 deste roadmap. Trazer o erro específico (comando + resposta) de volta pra sessão/conversa do bloco correspondente:
- Falha em Auth/RBAC → volta pro `roadmap-auth.md`
- Falha em Storage/Photos/Albums → volta pro `roadmap-upload-fotos.md`

---

## Dia 1 — DTO de paginação genérico + aplicar em Events e Announcements

> **Referência conceitual**: Aulas 36-38 do tutorial Django (filtros, busca textual, ordenação) — mesmo conceito, sintaxe diferente no Nest/Prisma.

```
Dia 1 do roadmap de Filtros/Busca/Ordenação (repo hchepli/nest-api).
Dia 0 (regressão) já feito e passou.

Hoje: criar um DTO de paginação genérico e aplicar em Events e Announcements
(as duas listagens públicas mais visitadas do site institucional).

O que fazer:
1. Criar src/common/dto/pagination-query.dto.ts:
   - page (@IsOptional @IsInt @Min(1), default 1)
   - limit (@IsOptional @IsInt @Min(1) @Max(100), default 10)
   - Usar @Type(() => Number) do class-transformer (query string vem como
     string, precisa converter).
2. Criar um tipo de retorno padrão pra respostas paginadas, ex:
   interface PaginatedResult<T> { data: T[]; total: number; page: number;
   limit: number; totalPages: number; }
   (pode ser um DTO ou só uma interface, sua escolha, mas usar o MESMO
   formato em toda listagem paginada do projeto).
3. Atualizar EventsService.findAll e AnnouncementsService.findAll (o
   público, não o findAllAdmin) para aceitar PaginationQueryDto, usando
   Prisma skip/take + um count() em paralelo (Promise.all).
4. Atualizar os Controllers correspondentes pra receber
   @Query() query: PaginationQueryDto.
5. NÃO mexer em busca textual nem ordenação ainda — só paginação pura hoje.

Gere os arquivos necessários (DTO comum + os 2 services/controllers
atualizados).
```

**Teste:**
```bash
curl "http://localhost:3000/events?page=1&limit=1"
# Deve retornar { data: [...1 item...], total: N, page: 1, limit: 1, totalPages: N }

curl "http://localhost:3000/events?page=999&limit=10"
# Página vazia -> data: [], total: N (não deve dar erro)

curl "http://localhost:3000/events?limit=500"
# limit acima do máximo (100) -> 400 (por causa do @Max(100))
```

---

## Dia 2 — Busca textual (search) em Events e Announcements

```
Dia 2 do roadmap de Filtros/Busca/Ordenação. Dia 1 (paginação) já feito.

Hoje: busca textual por nome/título.

1. Adicionar campo opcional `search` no PaginationQueryDto (ou em um DTO
   que o estenda, se preferir separar paginação de filtro - sua escolha,
   mas manter um padrão único).
2. EventsService.findAll: se `search` vier preenchido, filtrar por
   `name` usando Prisma `contains` + `mode: 'insensitive'` (Postgres).
3. AnnouncementsService.findAll: mesmo conceito, filtrando por `title`.
4. Combinar corretamente com a paginação do Dia 1 (o count() também
   precisa respeitar o filtro de busca, senão o totalPages fica errado).

Gere os arquivos atualizados.
```

**Teste:**
```bash
curl "http://localhost:3000/events?search=festa"
# Deve retornar só eventos com "festa" no nome (case-insensitive)

curl "http://localhost:3000/events?search=inexistente123"
# data: [], total: 0
```

---

## Dia 3 — Ordenação (sortBy/order)

```
Dia 3 do roadmap de Filtros/Busca/Ordenação. Dias 1-2 já feitos.

Hoje: ordenação configurável.

1. Adicionar sortBy (@IsOptional @IsString) e order (@IsOptional
   @IsIn(['asc','desc']), default 'asc') no DTO comum.
2. Em Events: permitir sortBy em ['startDate', 'name'] - se vier outro
   valor, ignorar e usar o default (startDate). Não deixar o usuário
   ordenar por qualquer coluna arbitrária do banco (risco de expor
   coluna sensível ou erro de SQL).
3. Em Announcements: permitir sortBy em ['createdAt', 'title'].
4. Default de ambos: mais recente primeiro (createdAt/startDate desc).

Gere os arquivos atualizados.
```

**Teste:**
```bash
curl "http://localhost:3000/events?sortBy=name&order=asc"
curl "http://localhost:3000/events?sortBy=campo_invalido&order=asc"
# Campo inválido -> não quebra, cai no default (startDate)
```

---

## Dia 4 — Filtros/paginação no Relatório de Escalas (RF008/UC023)

```
Dia 4 do roadmap de Filtros/Busca/Ordenação. Dias 1-3 já feitos (aplicados
em Events/Announcements, que são públicos).

Hoje: o mesmo conceito, mas no SchedulesService.findAll (relatório de
escalas - RF008), que já tem a filtragem por pastoral (RN006/RN008)
implementada desde o roadmap de Auth (Dia 6).

Pontos de atenção:
1. Adicionar filtros específicos do relatório: período (startDate/endDate
   filtrando pela data da Mass/Event vinculado - vai precisar de um join/
   include), massId, eventId, volunteerId (filtra por
   ScheduleAssignment.volunteerId).
2. O filtro de escopo por pastoral (RN006/RN008) que já existe TEM QUE
   continuar funcionando em conjunto com os filtros novos - um Coordenador
   de Pastoral que filtra por volunteerId só pode ver escalas da própria
   pastoral, mesmo que o voluntário também esteja em escalas de outra.
3. Aplicar a paginação do Dia 1 aqui também.
4. Não implementar exportação (CSV/PDF) ainda - só a filtragem e
   paginação da listagem em JSON.

Gere o SchedulesService.findAll atualizado e o Controller correspondente.
```

**Teste:**
```bash
# Admin Geral, sem filtro -> todas as escalas paginadas
curl "http://localhost:3000/schedules?page=1&limit=10" -H "Authorization: Bearer TOKEN_ADMIN"

# Coordenador de Pastoral, tentando filtrar por voluntário de outra pastoral
# -> deve retornar vazio (não 403, já que ele pode fazer a busca, só não
# encontra nada fora do escopo dele)
curl "http://localhost:3000/schedules?volunteerId=2" -H "Authorization: Bearer TOKEN_COORDENADOR"
```

---

## Dia 5 — Revisão final do bloco de Filtros/Paginação

```
Dia 5 (fechamento do bloco). Dias 1-4 já feitos.

Hoje: revisão geral, sem feature nova.

1. Conferir Swagger (/docs): os query params (page, limit, search, sortBy,
   order, e os filtros específicos de Schedules) devem aparecer
   documentados com @ApiQuery ou via decorators do DTO.
2. Rodar a bateria de testes dos Dias 1-4 de novo, de ponta a ponta.
3. Confirmar que nenhuma listagem pública ficou sem paginação (conferir
   se Sacraments/Pastorais precisam - RNF016 diz que usam cache/ISR, então
   paginação talvez nem faça sentido lá, perguntar antes de aplicar em
   tudo sem necessidade).
```

---

## Depois de Filtros/Paginação

Retomar o bloco pendente do roadmap geral:
- **Ações personalizadas** (ex: exportação do relatório de Escalas em
  CSV/PDF - RF008/UC023, que ficou de fora do Dia 4 acima de propósito).

Numeração de dias será retomada quando entrarmos nesse bloco.
