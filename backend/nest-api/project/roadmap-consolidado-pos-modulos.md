# Roadmap — Consolidado Pós-Módulos (Voluntário↔Pastoral, Auditoria, Calendário, Páginas Dedicadas)

Repositório back: https://github.com/hchepli/nest-api
Repositório front: Next.js admin (mesmo projeto do `roadmap-admin-modulos.md`)
Pré-requisito: `roadmap-admin-modulos.md` (Blocos 1-3: Calendário, Comunidade, Escalas) concluído.

Cada dia abaixo é um prompt pronto pra colar no início da sessão. Cole o prompt do dia, cole o resultado dos comandos/arquivos que eu pedir, e seguimos.

## Decisões já travadas nesta etapa (não reabrir sem avisar)

- **Voluntário ↔ Pastoral**: relação **1:N** — cada Voluntário pertence a exatamente 1 Pastoral (igual ao padrão já usado em User/Coordenador de Pastoral). Se a mesma pessoa ajuda em duas Pastorais, vira 2 cadastros de Voluntário separados por enquanto. N:N fica registrado como débito técnico futuro, **não implementar agora**.
- **Auditoria (AuditLog)**: Interceptor **global** do NestJS + decorator explícito `@Auditable('NomeEntidade')` aplicado só nos endpoints que devem logar (evita logar rota pública sem `req.user`, tipo `attendance-confirmations`). Pra UPDATE/DELETE, o interceptor busca o registro *antes* de deixar a request seguir, pra montar `dados_anteriores`/`dados_novos` reais.
- **Missas Recorrentes**: geração **física** (grava `Mass` de verdade no banco, não é cálculo virtual), mas disparada **"pegando carona"** em uma requisição que já ia acontecer (o `GET /calendar`) — sem cron, sem depender de decisão de hospedagem. Se um dia a hospedagem suportar cron de verdade, troca-se só o gatilho, a lógica de geração continua igual.
- **Modais → Páginas completas** (Bloco 9): fica pro final de propósito, porque mexe transversalmente em praticamente todo formulário já construído.

## Pendência de investigação (não trava o início, mas trava a confirmação final de 2 blocos)

Ainda não recebi os arquivos `audit-logs.controller.ts`/`audit-logs.service.ts` (Bloco 2) e `events.controller.ts` (Bloco 3). O roadmap abaixo já assume a abordagem mais provável pra cada um, mas o **Dia 1 de cada bloco começa pedindo esses arquivos** — se o que eu encontrar for diferente do assumido aqui, a gente ajusta o resto do bloco antes de seguir, em vez de eu ter assumido errado e você descobrir só depois de codar.

---

## BLOCO 1 — Voluntário ↔ Pastoral (schema + backend + front)

**Destrava:** seleção de Voluntário filtrada/sugerida na Escala, card "Membros Ativos" por pastoral.

### Dia 1 — Schema: Volunteer ganha pastoralGroupId

```
Vamos começar o Bloco 1 do roadmap consolidado (repo hchepli/nest-api):
vínculo Voluntário ↔ Pastoral.

Decisão já travada: relação 1:N (1 Voluntário pertence a exatamente 1
Pastoral, igual ao padrão já usado em User/Coordenador de Pastoral —
RN006). Não implementar N:N.

Hoje:
1. Adicionar pastoralGroupId (FK obrigatória) ao model Volunteer no
   schema.prisma, seguindo o MESMO padrão de relação já usado em
   User.pastoralGroupId (RN006).
2. Adicionar campo opcional defaultRole (String?) ao model PastoralGroup
   — vai guardar a função padrão sugerida pro voluntário daquela pastoral
   (ex: Liturgia -> "leitor", Coroinhas -> "coroinha"). Sem @IsEnum, é
   texto livre, mesma decisão já tomada pro campo role em
   ScheduleAssignment (Dia 5 do roadmap-backend.md).
3. Gerar a migration. ATENÇÃO: Volunteers já existentes no banco (do
   seed ou cadastrados manualmente) vão quebrar a migration se
   pastoralGroupId for NOT NULL sem default — me perguntar antes de
   decidir entre (a) permitir null temporariamente com um cleanup manual
   depois, ou (b) popular todos os Volunteers existentes com uma
   Pastoral "genérica" via script antes de aplicar o NOT NULL.

Me pergunte sobre o ponto 3 antes de gerar a migration.
```

**Teste:**
```bash
npx prisma studio
# Conferir que Volunteer agora tem pastoralGroupId e PastoralGroup tem defaultRole
```

---

### Dia 2 — Backend: CRUD de Volunteer atualizado

```
Dia 2 do Bloco 1. Dia 1 (migration) já feito.

Hoje: atualizar CreateVolunteerDto/UpdateVolunteerDto e o
VolunteersService pra exigir/usar o vínculo.

1. CreateVolunteerDto: adicionar pastoralGroupId (@IsInt, obrigatório).
2. VolunteersService.findAll: aceitar filtro opcional ?pastoralGroupId=
   na query (útil pro Dia 3 do front, que vai filtrar o select por
   pastoral).
3. Se o usuário logado for Coordenador de Pastoral criando um Voluntário
   (RN006): o pastoralGroupId do Voluntário deve necessariamente bater
   com o pastoralGroupId do próprio Coordenador — se ele tentar cadastrar
   Voluntário pra outra pastoral, bloquear com 403 (mesma lógica de
   escopo já usada em Schedule, roadmap-auth.md Dia 6).
4. Admin Geral/Secretaria podem cadastrar Voluntário pra qualquer
   Pastoral, sem restrição.

Gere o DTO atualizado e o VolunteersService atualizado.
```

**Teste:**
```bash
# Cadastro sem pastoralGroupId -> 400
curl -X POST http://localhost:3000/volunteers -H "Content-Type: application/json" -d "{\"nome\":\"Fulano\",\"telefone\":\"11999999999\"}"

# Coordenador tentando cadastrar Voluntário pra pastoral que não é a dele -> 403
curl -X POST http://localhost:3000/volunteers -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_COORDENADOR" \
  -d "{\"nome\":\"Fulano\",\"telefone\":\"11999999999\",\"pastoralGroupId\":2}"

# Filtro por pastoral -> só retorna voluntários daquela pastoral
curl "http://localhost:3000/volunteers?pastoralGroupId=1" -H "Authorization: Bearer TOKEN_ADMIN"
```

---

### Dia 3 — Front: cadastro de Voluntário + filtro no modal de Escala

```
Dia 3 do Bloco 1 (front, Next.js admin). Dia 2 (backend) já feito.

Hoje:
1. Formulário de cadastro de Voluntário (onde quer que ele hoje esteja —
   confirmar comigo o caminho do arquivo atual antes de editar) passa a
   exigir seleção de Pastoral (select vindo de usePastoralGroups()).
2. No RegisterScheduleModal (Bloco 3 do roadmap-admin-modulos.md):
   - O select de Voluntário passa a ser FILTRADO pela Pastoral vinculada
     à Missa/Evento sendo escalado (não mostrar voluntários de outra
     pastoral na lista).
   - Ao selecionar um Voluntário, o campo de função (role, texto livre)
     é PRÉ-PREENCHIDO com o defaultRole da Pastoral dele, mas o admin
     ainda pode editar manualmente antes de salvar (não travar como
     read-only).
3. Se a Missa/Evento ainda não tiver Pastoral vinculada (Bloco 3 deste
   roadmap ainda não implementado nesse ponto) — por ora, sem filtro
   nenhum, mostrar todos os voluntários (fallback até o Bloco 3 estar
   pronto).

Antes de editar, me confirme o caminho do arquivo de cadastro de
Voluntário atual (componente/página).
```

**Teste manual:**
- Cadastrar Voluntário exigindo Pastoral.
- Abrir "Registrar Escala" numa Missa com Pastoral vinculada → select de Voluntário mostra só os daquela pastoral, função já vem preenchida.

---

## BLOCO 2 — Auditoria automática (AuditLog)

**Resolve:** "Últimas movimentações" do Painel Admin, que nunca funcionou.

### Dia 1 — Investigação + confirmação da abordagem

```
Bloco 2 do roadmap consolidado (repo hchepli/nest-api): consertar a
auditoria (RNF011), que hoje nunca gera log mesmo eu alterando dados.

Preciso que você analise src/audit-logs/audit-logs.controller.ts e
src/audit-logs/audit-logs.service.ts (vou colar o conteúdo) e me diga:
1. O CRUD de AuditLog em si funciona (dá pra criar um log manualmente
   via POST /audit-logs)?
2. Existe QUALQUER interceptor, middleware ou chamada manual em outro
   service que hoje cria um AuditLog automaticamente? (resposta esperada:
   não, mas confirmar).

Abordagem já decidida (a confirmar se ainda faz sentido depois de ver o
código): Interceptor GLOBAL do NestJS + decorator @Auditable('NomeEntidade')
aplicado explicitamente nos controllers das entidades que devem logar
(Mass, Event, Announcement, Schedule, User, Volunteer). Sem o decorator,
o interceptor ignora a rota — evita logar endpoint público sem
req.user (ex: attendance-confirmations).

Se o código que eu colar sugerir outra abordagem mais simples dado o que
já existe, me avise antes de eu confirmar o plano do Dia 2.

[Colar aqui o conteúdo dos 2 arquivos]
```

---

### Dia 2 — Interceptor + decorator @Auditable

```
Dia 2 do Bloco 2. Dia 1 (investigação) já feito e abordagem confirmada.

Hoje:
1. Criar decorator @Auditable(entityName: string) (SetMetadata).
2. Criar AuditInterceptor global (aplicado via APP_INTERCEPTOR no
   AppModule):
   - Só age em rotas marcadas com @Auditable().
   - Em CREATE: registra dados_novos = corpo criado, dados_anteriores = null.
   - Em UPDATE/DELETE: busca o registro ANTES de deixar a request seguir
     pro handler (query extra no mesmo service/prisma), guarda como
     dados_anteriores; em UPDATE, dados_novos = resultado após o update.
   - Captura userId de req.user.sub (payload do JWT) — se não houver
     usuário autenticado (rota pública), não loga nada, mesmo que
     @Auditable() esteja presente por engano (proteção extra).
3. Aplicar @Auditable('Mass'), @Auditable('Event'), @Auditable('Announcement'),
   @Auditable('Schedule'), @Auditable('User'), @Auditable('Volunteer') nos
   respectivos controllers, nos métodos create/update/remove.
4. NÃO aplicar em entidades de configuração simples (Role, Permission,
   Category, PastoralGroup) por enquanto — perguntar se deve expandir
   depois de confirmar que o básico funciona.

Gere o decorator, o interceptor, e a lista de controllers a alterar.
```

**Teste:**
```bash
# Criar/editar uma Missa
curl -X POST http://localhost:3000/masses -H "Authorization: Bearer TOKEN_ADMIN" -H "Content-Type: application/json" -d "{\"title\":\"Missa Teste Audit\",\"dateTime\":\"2026-12-25T19:00:00.000Z\",\"location\":\"Igreja Matriz\"}"

# Conferir que gerou log
curl http://localhost:3000/audit-logs -H "Authorization: Bearer TOKEN_ADMIN"
# Deve aparecer entrada com entidade=Mass, acao=CREATE, usuario_id preenchido
```

---

### Dia 3 — Front: ligar "Últimas movimentações" de verdade

```
Dia 3 do Bloco 2. Dia 2 (interceptor gerando log de verdade) já feito e
testado.

Hoje: trocar o mock/vazio da tabela "Últimas movimentações" do Painel
Admin por dado real.

1. src/hooks/useAuditLogs.ts — useQuery em GET /audit-logs (paginado,
   últimos N registros, sugestão: 10, ordenado por createdAt desc).
2. Tabela do Painel Admin: Data, Descrição (montar uma frase simples tipo
   "{acao} em {entidade}" a partir dos campos — ex: "CREATE em Mass"),
   Tipo, e o campo "valor" do Figma original — confirmar comigo se isso
   ainda faz sentido pra AuditLog (o schema não tem um campo monetário,
   pode ser que o Figma tenha sido pensado pensando em Doações/Finanças,
   que está fora de escopo — RN013). Se não fizer sentido, tirar a coluna
   "valor" da tabela.

Me confirme o ponto da coluna "valor" antes de finalizar a tabela.
```

---

## BLOCO 3 — Vínculo Pastoral em Missa/Evento

**Destrava:** card "Pendentes" de Escalas (Bloco 4) e o pedido do Calendário (ver Missa/Evento já mostrando quais Pastorais precisam escalar).

> Nota: isso corresponde ao model `MassPastoralGroup`/`EventPastoralGroup` já citado como pendência no `roadmap-schedule-aninhado.md` (Dia 3) e no `.sql` de referência (RN017 proposta). Se aquele Dia 3 já tiver sido feito, este bloco só adiciona a parte de FRONT; o Dia 1 abaixo confirma o que já existe antes de gerar código duplicado.

### Dia 1 — Investigação + backend (se ainda não existir)

```
Bloco 3 do roadmap consolidado: vínculo de Pastorais participantes em
Missa/Evento (RN017 proposta, já citada como pendência no
roadmap-schedule-aninhado.md).

Preciso que você analise src/events/events.controller.ts e (se já
existir) o service correspondente, e me diga se o vínculo N:N com
PastoralGroup (via MassPastoralGroup/EventPastoralGroup) já foi
implementado no Dia 3 daquele roadmap, ou se ainda está pendente.

[Colar aqui o conteúdo de events.controller.ts]

SE ainda não existir:
1. Adicionar aos models Mass e Event no schema.prisma um relacionamento
   N:N com PastoralGroup (via tabelas de junção, seguindo o padrão já
   desenhado no schema_modelagem_mysql.sql: missa_pastorais/
   evento_pastorais). Gerar migration.
2. CreateMassDto/CreateEventDto ganham campo opcional pastoralGroupIds
   (array de int, @IsArray @IsInt({each:true}) @IsOptional).
3. No create/update do MassesService/EventsService, sincronizar a tabela
   de junção a partir desse array.

SE já existir: pular pro Dia 2 direto, sem gerar nada novo aqui.
```

---

### Dia 2 — Front: seletor de Pastorais no formulário de Missa/Evento

```
Dia 2 do Bloco 3. Dia 1 (backend confirmado ou implementado) já feito.

Hoje: no formulário "Nova Missa" e "Novo Evento" (Dia 4 do Bloco 1 de
roadmap-admin-modulos.md), adicionar um multi-select "Pastorais
participantes" (usa usePastoralGroups(), já existente).

1. Campo pastoralGroupIds no formulário, enviado junto no POST/PATCH.
2. No card de detalhe da Missa/Evento no painel lateral do Calendário
   (Dia 6 deste roadmap, "Edição pelo Calendário"), mostrar as Pastorais
   vinculadas como tags/badges.
3. Isso é o que vai permitir, no Bloco 4, a página de Escalas mostrar
   "esta Missa tem Liturgia e Coroinhas vinculadas, mas só Liturgia já
   escalou — Coroinhas está pendente".

Gere os formulários atualizados.
```

**Teste manual:**
- Criar Missa vinculando 2 Pastorais → conferir na Prisma Studio que a tabela de junção populou.

---

## BLOCO 4 — Card "Pendentes" em Escalas

**Depende do Bloco 3.**

### Dia 1 — Backend: endpoint de pendências

```
Bloco 4 do roadmap consolidado. Dia 2 do Bloco 3 (Pastoral vinculada a
Mass/Event) já feito.

Hoje: um endpoint que devolve, pra um período, quais Missas/Eventos têm
Pastoral vinculada MAS ainda não têm Schedule criada pra aquela
Pastoral específica.

1. No SchedulesService (ou um novo método), criar findPending(start, end,
   user): busca todas as Mass/Event do período com pastoralGroups
   vinculados (include), busca as Schedules já existentes do período, e
   calcula a diferença (Pastoral vinculada à Missa/Evento, mas sem
   Schedule com aquele pastoralId + massId/eventId).
2. Aplicar o MESMO escopo por pastoral já usado no findAll (RN006/RN008,
   roadmap-auth.md Dia 6): Coordenador de Pastoral só vê pendências da
   própria pastoral; Admin Geral/Secretaria veem todas.
3. Formato de retorno sugerido:
   [{ massId: 1, massTitle: "...", pastoralGroupId: 2, pastoralGroupName: "Coroinhas" }]
   (ou equivalente pra Event) — perguntar se esse formato serve antes de
   fixar, já que o front do Dia 2 vai depender dele.
4. Expor como GET /schedules/pending?start=...&end=....

Me pergunte sobre o formato do retorno (ponto 3) antes de fixar.
```

**Teste:**
```bash
# Admin Geral -> todas as pendências do período
curl "http://localhost:3000/schedules/pending?start=2026-01-01&end=2026-01-31" -H "Authorization: Bearer TOKEN_ADMIN"

# Coordenador -> só pendências da própria pastoral
curl "http://localhost:3000/schedules/pending?start=2026-01-01&end=2026-01-31" -H "Authorization: Bearer TOKEN_COORDENADOR"
```

---

### Dia 2 — Front: card "Pendentes" real na página de Escalas

```
Dia 2 do Bloco 4. Dia 1 (endpoint) já feito.

Hoje:
1. src/hooks/usePendingSchedules.ts — useQuery em GET /schedules/pending
   pro mês corrente.
2. Card "Pendentes" (que hoje está mockado/omitido na página de Escalas,
   conforme Dia 2 do Bloco 3 de roadmap-admin-modulos.md) passa a mostrar
   a contagem real.
3. Clicar no card mostra a lista (Missa/Evento + Pastoral faltando) —
   reaproveitar padrão visual já usado em outra lista/modal simples do
   projeto, sem inventar componente novo.
4. Coordenador de Pastoral vê só as pendências da própria pastoral
   (o backend já filtra, o front só renderiza).

Gere o hook + o card atualizado.
```

**Teste manual:**
- Criar Missa com 2 Pastorais vinculadas, escalar só 1 → card "Pendentes" mostra 1, indicando a Pastoral que falta.

---

## BLOCO 5 — Missas Recorrentes

**Isolado — pode rodar em paralelo aos outros blocos.**

Estratégia travada: geração **física** (grava `Mass` real no banco), disparada **sob demanda** a partir do `GET /calendar` (sem cron, sem depender de infra).

### Dia 1 — Modelagem: MassTemplate

```
Bloco 5 do roadmap consolidado (repo hchepli/nest-api): Missas
Recorrentes.

Estratégia já travada: SEM cron. Geração física (grava Mass real no
banco), disparada sob demanda a partir do GET /calendar — toda vez que
o endpoint é chamado, garante que as próximas N semanas de cada template
ativo já existem como Mass; se faltar, gera ali mesmo antes de responder.

Hoje: modelagem.
1. Criar model MassTemplate no schema.prisma: dayOfWeek (Int, 0-6),
   time (String, formato "HH:mm", ou DateTime só com a hora - escolher o
   que for mais simples de somar com a data gerada, sugerir e perguntar),
   title, location, type (mesmo enum COMMON/SPECIAL de Mass), notes
   (opcional), active (Boolean default true).
2. Adicionar ao model Mass um campo opcional generatedFromTemplateId (FK
   pra MassTemplate) - permite identificar quais Mass foram
   auto-geradas (útil pro Dia 2, pra não gerar duplicata).
3. Gerar migration.
4. NÃO implementar a lógica de geração ainda - só o schema hoje.

Me pergunte sobre o formato do campo "time" antes de fixar.
```

---

### Dia 2 — Backend: lógica de geração "pegando carona" no /calendar

```
Dia 2 do Bloco 5. Dia 1 (schema) já feito.

Hoje: a lógica de geração de verdade.

1. Criar MassTemplatesModule com CRUD básico de MassTemplate (só Admin
   Geral/Secretaria podem gerenciar).
2. Criar um método (ex: MassTemplatesService.ensureGenerated(untilDate)):
   pra cada MassTemplate ativo, calcula as próximas ocorrências até
   `untilDate` (sugestão: sempre garantir pelo menos 8 semanas à frente -
   perguntar se esse número faz sentido antes de fixar) e, pra cada
   ocorrência que ainda NÃO existe como Mass (checar por
   generatedFromTemplateId + data), cria a Mass real.
3. No CalendarController (GET /calendar), ANTES de buscar Mass/Event do
   período, chamar massTemplatesService.ensureGenerated(end) - garante
   que o período consultado já tem as recorrências materializadas antes
   de responder.
4. Idempotência: chamar o endpoint várias vezes seguidas NÃO deve gerar
   Mass duplicada - a checagem do ponto 2 precisa ser sólida (não só "já
   passou tempo suficiente", mas "essa data+template específica já foi
   gerada?").
5. Edição/cancelamento de uma ocorrência específica: é uma Mass normal,
   editável/removível como qualquer outra (RN016 - se tiver Schedule
   vinculada, mesmo aviso de sempre) - não precisa de lógica nova pra
   isso, só confirmar que generatedFromTemplateId não impede edição
   normal.

Me pergunte sobre o número de semanas de antecedência (ponto 2) antes de
fixar.
```

**Teste:**
```bash
# Criar um template (ex: toda segunda 19h)
curl -X POST http://localhost:3000/mass-templates -H "Authorization: Bearer TOKEN_ADMIN" -H "Content-Type: application/json" -d "{\"dayOfWeek\":1,\"time\":\"19:00\",\"title\":\"Missa Semanal\",\"location\":\"Igreja Matriz\"}"

# Chamar o calendário -> deve gerar as ocorrências reais
curl "http://localhost:3000/calendar?start=2026-01-01&end=2026-03-01" -H "Authorization: Bearer TOKEN_ADMIN"

# Chamar de novo, mesmo período -> NÃO deve duplicar (conferir count de Mass antes/depois)
curl "http://localhost:3000/calendar?start=2026-01-01&end=2026-03-01" -H "Authorization: Bearer TOKEN_ADMIN"
```

---

### Dia 3 — Front: tela/modal de "Missa Recorrente"

```
Dia 3 do Bloco 5. Dia 2 (geração funcionando) já feito.

Hoje: no Calendário, uma opção distinta de "Missa avulsa" (Dia 4 do
Bloco 1 de roadmap-admin-modulos.md) pra criar um MassTemplate.

1. No modal "Nova Missa", adicionar um toggle "Repetir semanalmente" -
   se ativado, o formulário muda pra pedir dia da semana + horário (em
   vez de data única), e o submit vai pra POST /mass-templates em vez de
   POST /masses.
2. Gestão de templates (editar/desativar) - página simples, ou dentro do
   próprio modal reaberto num "modo edição" - perguntar preferência
   antes de implementar, já que ainda não foi mapeado no Figma.

Gere o toggle no modal + o método POST pra mass-templates na Route
Handler.
```

---

## BLOCO 6 — Edição de Missa/Evento pelo Calendário

### Dia 1 — Clique no card abre modo edição

```
Bloco 6 do roadmap consolidado (front): clicar numa Missa/Evento no
painel lateral (agenda do dia) do Calendário abre o mesmo modal de
criação, mas em modo edição.

1. O painel lateral (CalendarSidebar/agenda) já lista os itens do dia -
   adicionar onClick em cada item.
2. O modal "Nova Missa"/"Novo Evento" (Dia 4 do Bloco 1 de
   roadmap-admin-modulos.md) ganha um modo edição: se receber um item
   existente, pré-preenche os campos e troca o submit de POST pra PATCH
   /masses/:id ou /events/:id.
3. Se a Missa/Evento tiver Pastorais vinculadas (Bloco 3 deste roadmap),
   o multi-select já vem pré-marcado.
4. Após editar com sucesso: invalidar a query ['calendar', ...], mesmo
   padrão já usado na criação.

Gere o modal atualizado com o modo edição.
```

**Teste manual:**
- Clicar numa Missa existente no painel lateral → modal abre preenchido → editar local → salvar → grade atualiza sem reload.

---

## BLOCO 7 — Páginas de gestão dedicadas (a partir da Comunidade)

> Decisão desta etapa: a página `/comunidade` vira uma visão GERAL (cards + listagens resumidas); cada card com função de navegação leva pra uma página de gestão completa, layout inspirado na página de Escalas (que já tem tabela + filtros + ações).

### Dia 1 — /comunidade/galeria (Álbuns/Fotos)

```
Bloco 7, Dia 1: página dedicada de gestão de Galeria.

1. src/app/comunidade/galeria/page.tsx - layout inspirado na página de
   Escalas (tabela + ações), mas pra Álbuns: título, evento vinculado
   (se houver), quantidade de fotos, ações (Editar, Ver fotos, Remover).
2. Dentro de cada Álbum (ex: /comunidade/galeria/[id]): grid de fotos já
   com upload real (o backend já suporta via R2, roadmap-upload-fotos.md
   - reaproveitar, não reimplementar upload).
3. Marcar foto como capa (RN010, isCover) direto nessa tela.
4. O card "Fotos na galeria" na página /comunidade passa a ser um link
   pra esta página.

Gere a página de listagem de Álbuns + a página de detalhe/upload.
```

---

### Dia 2 — /comunidade/eventos (CRUD completo)

```
Bloco 7, Dia 2: página dedicada de gestão de Eventos.

1. src/app/comunidade/eventos/page.tsx - tabela: nome, data, categoria,
   Pastorais vinculadas (Bloco 3), ações (Editar, Remover, Ver
   confirmações de presença - UC036).
2. Reaproveitar o modal de criar/editar Evento já construído (Blocos 1 e
   6 deste roadmap) - não duplicar componente.
3. O card "Próximos Eventos" na página /comunidade passa a ser um link
   pra esta página.

Gere a página.
```

---

### Dia 3 — /comunidade/comunicados (CRUD completo)

```
Bloco 7, Dia 3: página dedicada de gestão de Comunicados (Announcement).

1. src/app/comunidade/comunicados/page.tsx - a tabela que já existe hoje
   dentro de /comunidade (Dia 1 do Bloco 2 de roadmap-admin-modulos.md)
   MOVE pra cá, com filtros/paginação/busca já existentes.
2. O card "Notícias Publicadas"/"Itens ocultos" na página /comunidade
   passam a ser links pra esta página (já filtrada por status via query
   param, se fizer sentido).

Gere a página (movendo a lógica que já existe, sem recriar do zero).
```

---

### Dia 4 — Cards da Comunidade viram links + revisão

```
Bloco 7, Dia 4 (fechamento). Dias 1-3 já feitos.

1. Confirmar que os 4 cards do topo de /comunidade (Próximos Eventos,
   Notícias Publicadas, Fotos na galeria, Itens ocultos) navegam
   corretamente pra suas páginas dedicadas.
2. A página /comunidade em si mantém só os cards + talvez uma prévia
   curta de cada lista (não a tabela completa, que já mudou de lugar).
3. Rodar de ponta a ponta: criar Álbum, subir fotos, marcar capa, criar
   Evento vinculando Pastoral, criar/ocultar Comunicado - tudo pelas
   páginas novas.
```

---

## BLOCO 8 — Fechar cards restantes do Painel Admin

**Depende dos Blocos 2 (Últimas movimentações) e 4 (Pendentes/Escalas do mês).**

### Dia 1 — Conectar os cards que já têm dado

```
Bloco 8, Dia 1: fechar o Painel Admin com dados reais.

1. Card "Escalas do mês" -> ligar em useSchedulesSummary (já existe do
   Bloco 3 de roadmap-admin-modulos.md, só falta conectar aqui).
2. Card "Últimas movimentações" -> já resolvido no Bloco 2 deste
   roadmap, só confirmar que está no Painel também (não só numa página
   separada).
3. Mini calendário/agenda lateral do Painel -> já deve estar puxando do
   mesmo useCalendar() do Bloco 1 de roadmap-admin-modulos.md, confirmar.

Gere as conexões que faltarem.
```

---

### Dia 2 — Cards com decisão ainda pendente

```
Bloco 8, Dia 2: os 3 cards que dependem de decisão antiga ainda em
aberto.

1. Card "Avisos pendentes" -> ligar em GET /announcements?status=DRAFT
   (contagem). Confirmar se "pendente" = DRAFT mesmo (equivalência já
   assumida no Dia 4 do roadmap-admin-frontend.md original).
2. Card "Fotos na galeria" -> agora que /comunidade/galeria existe
   (Bloco 7), ligar em contagem real de Photo (últimos 30 dias, conforme
   Figma original).
3. Card "Sacramentos" -> AINDA pendente de reinterpretação (Sacrament
   não tem data, "2 esta semana" do Figma não faz sentido literal).
   Opções: (a) trocar o card por algo que faça sentido pra Sacrament
   (ex: contagem total cadastrada, sem "desta semana"), ou (b) remover o
   card do Painel até haver um conceito real de "celebração agendada".
   Não decidir sozinho - apresentar as duas opções e aguardar.

Me pergunte sobre o ponto 3 antes de implementar esse card específico.
```

---

## BLOCO 9 — Modais → Páginas completas (final, como pedido)

> Refatoração transversal — por isso fica por último, depois que todos os formulários envolvidos (Missa, Evento, Escala, Álbum, Comunicado, Voluntário) já estiverem maduros e estáveis dos blocos anteriores.

### Dia 1 — Padrão de página de criação + primeira migração (Evento)

```
Bloco 9, Dia 1: trocar o modal de criar Evento por uma página completa.

1. Definir o padrão de rota: /eventos/criar (fora do modal). Ao salvar
   com sucesso, redireciona pra página anterior (o Calendário ou
   /comunidade/eventos, dependendo de onde o usuário veio - usar
   router.back() ou guardar a origem via query param, perguntar qual
   abordagem preferem antes de fixar).
2. Migrar o conteúdo do EventModal atual pra essa página nova, mantendo
   os mesmos campos/validações (incluindo o multi-select de Pastorais do
   Bloco 3).
3. Todo ponto do sistema que hoje abre o modal de criar Evento passa a
   navegar pra /eventos/criar.

Me pergunte sobre a estratégia de "voltar pra página anterior" (ponto 1)
antes de fixar.
```

---

### Dia 2 — Escala

```
Bloco 9, Dia 2: mesmo padrão do Dia 1, aplicado ao modal "Registrar
Escala" -> /escalas/criar.

Reaproveitar a decisão de navegação já fixada no Dia 1 (mesma
estratégia de "voltar").
```

---

### Dia 3 — Álbum e Comunicado

```
Bloco 9, Dia 3: mesmo padrão, aplicado a:
- Modal "Novo Álbum" -> /comunidade/galeria/criar
- Modal "Novo Aviso/Nova Notícia" -> /comunidade/comunicados/criar
```

---

### Dia 4 — Missa + revisão final do roadmap consolidado

```
Bloco 9, Dia 4 (fechamento de todo o roadmap consolidado): modal "Nova
Missa" -> /calendario/nova-missa (ou caminho equivalente), incluindo o
toggle de recorrência do Bloco 5.

Revisão final geral:
1. Rodar TODOS os fluxos de ponta a ponta, logado como os 3 cargos.
2. Confirmar RN006/RN007/RN008/RN010/RN016/RN017 (proposta) todos
   respeitados nas telas novas.
3. Atualizar o roadmap-backend.md e o contexto-projeto-paroquia.md com
   as decisões formalizadas nesta etapa (Voluntário 1:N Pastoral,
   Missas Recorrentes, RN017 incorporada de vez).
```

---

## Resumo da ordem (dependências)

```
Bloco 1 (Voluntário↔Pastoral) ─┐
Bloco 2 (Auditoria) ───────────┼─ independentes entre si, podem rodar em paralelo
Bloco 5 (Missas Recorrentes) ──┘

Bloco 3 (Pastoral em Missa/Evento) ──> Bloco 4 (Pendentes em Escalas)
Bloco 3 ──> Bloco 6 (Edição pelo Calendário, se quiser já mostrar Pastorais no card)

Bloco 7 (Páginas dedicadas) ──> Bloco 8 (fechar Painel Admin, usa dados que só existem depois do 7)
Bloco 2 + Bloco 4 ──> Bloco 8 (cards de Últimas Movimentações e Pendentes/Escalas do mês)

Bloco 9 (Modais → Páginas) ──> por último, depois de tudo estabilizado
```

Sugestão de execução pra amanhã: começar pelo **Bloco 1** (mais isolado, destrava o resto de Escalas) ou já mandar os arquivos de investigação (`audit-logs.controller.ts`/`.service.ts` e `events.controller.ts`) pra eu confirmar Blocos 2 e 3 enquanto você roda o Bloco 1.
