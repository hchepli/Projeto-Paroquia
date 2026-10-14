# Roadmap — Admin por Módulo (Calendário → Comunidade → Escalas)

Repositório front: (Next.js, admin) — código já iniciado (layout, login mínimo, dashboard parcialmente mockado).
Repositório back: https://github.com/hchepli/nest-api
Pré-requisito: `roadmap-schedule-aninhado.md` e `roadmap-filtros-paginacao.md` concluídos (Auth+RBAC+CRUD completo).

## Por que este roadmap existe

O `roadmap-admin-frontend.md` original tentou começar pelo Painel Admin (dashboard), mas o dashboard depende de dados agregados de módulos que ainda não existem de verdade no admin (Missas "default" recorrentes, Eventos, Comunicados, Escalas). Decisão tomada: **construir por módulo primeiro** (Calendário → Comunidade → Escalas), e só depois voltar a fechar o dashboard com dados reais de cada módulo já maduro.

O Painel Admin (`PainelPage`) fica como está — parcialmente conectado (Missas hoje, Próximos eventos, Últimas movimentações via AuditLog), parcialmente mockado (Escalas do mês, Sacramentos, Avisos pendentes, Fotos na galeria, Agenda lateral) — até este roadmap terminar.

## Decisões já tomadas nesta etapa

- **Calendário**: vai consumir um endpoint agregado novo no backend (`GET /calendar`), não múltiplas chamadas mescladas no client.
- **Botão "Novo Sacramento"** no Calendário: **removido por enquanto** — Sacrament não tem data/hora, não faz sentido como item de calendário. Se isso mudar de ideia no futuro, é uma decisão nova, não assumir reinterpretação como "Event com categoria Sacramento".
- **Grade visual do calendário**: componente próprio (não FullCalendar) — o design do Figma é específico e não há necessidade de drag-and-drop/reagendamento por enquanto. Reaproveitar a lógica que já existe em `CalendarSidebar` (`getDaysInMonth`, `getFirstWeekdayOffset`) como base.
- **Estado global / dados**: React Query no client + Route Handlers do Next.js como proxy autenticado (token fica em cookie httpOnly, nunca chega no browser) — mesmo padrão já usado no dashboard.

---

## BLOCO 1 — Calendário

### Dia 1 — Backend: endpoint agregado `GET /calendar`

```
Vamos criar um endpoint agregado no backend (repo hchepli/nest-api) pro
Calendário do admin.

Contexto: hoje não existe endpoint único que devolva Missas + Eventos
juntos num formato de calendário. O front vai consumir isso pra montar
a grade (dia/semana/mês/ano).

O que fazer:
1. Criar um módulo/controller novo (ex: CalendarController, sem entidade
   própria no Prisma — só agrega Mass + Event) OU adicionar um endpoint
   dentro de um dos módulos existentes, se preferir menos arquivos novos
   (sugerir as duas opções e perguntar antes de escolher).
2. GET /calendar deve aceitar query params obrigatórios de período:
   ?start=2026-01-01&end=2026-01-31 (ambos @IsISO8601), validados via DTO
   próprio (CalendarQueryDto).
3. Buscar Mass (filtrando dateTime dentro do período) e Event (filtrando
   startDate dentro do período) em paralelo (Promise.all).
4. Normalizar o retorno num formato ÚNICO, só com os campos que o
   calendário precisa:
   [
     { id: 1, title: "Missa Dominical", date: "2026-01-04T10:00:00.000Z", type: "mass" },
     { id: 2, title: "Festa Junina", date: "2026-06-20T18:00:00.000Z", type: "event" }
   ]
   (usar dateTime pra Mass e startDate pra Event como campo "date" comum;
   NÃO incluir endDate por enquanto, é só marcação de início na grade).
5. Endpoint deve ser @Public() se as listagens de Mass/Event já são
   públicas hoje (confirmar comigo antes de decidir — pode ser que o
   admin precise de campos extras que a versão pública não deveria
   expor, nesse caso mantém protegido).
6. Escopo por pastoral (RN006/RN008): NÃO aplicar aqui — Missas e
   Eventos não têm esse conceito de escopo (só Schedule tem). Confirmar
   que Coordenador de Pastoral pode ver todas as Missas/Eventos no
   calendário normalmente (só Schedule é restrito à pastoral dele).

Me pergunte sobre os pontos 1 e 5 antes de decidir.
```

**Teste:**
```bash
curl "http://localhost:3000/calendar?start=2026-01-01&end=2026-01-31"
# Deve retornar array normalizado, só com Missas/Eventos dentro do período

curl "http://localhost:3000/calendar?start=2026-01-01"
# Sem "end" -> 400 (ambos obrigatórios)
```

---

### Dia 2 — Frontend: types + hook + Route Handler do Calendário

```
Dia 2 do bloco Calendário (front, Next.js admin). Dia 1 (endpoint
GET /calendar) já feito no backend.

O que fazer:
1. Criar src/types/calendar-item.ts:
   export type CalendarItemType = 'mass' | 'event';
   export interface CalendarItem { id: number; title: string; date: string; type: CalendarItemType; }
2. Criar src/app/api/calendar/route.ts — Route Handler proxy (mesmo
   padrão de src/app/api/masses/route.ts): lê o cookie access_token,
   repassa start/end da query string pro backend, retorna o array.
3. Criar src/hooks/useCalendar.ts — useQuery(['calendar', start, end]),
   parametrizado por período (o componente de calendário decide qual
   período buscar conforme a visão ativa: dia/semana/mês/ano).
4. NÃO montar a grade visual ainda — só a camada de dados, testável via
   um console.log temporário ou React Query Devtools.

Gere os 3 arquivos.
```

**Teste:**
```
No React Query Devtools (ou console), confirmar que useCalendar(start, end)
retorna os itens esperados ao trocar o período.
```

---

### Dia 3 — Frontend: grade visual (visão Mês)

```
Dia 3 do bloco Calendário. Dia 2 (hook + dados) já feito.

Hoje: só a visão MÊS da grade (as outras視 — dia/semana/ano — ficam pros
próximos dias, começar pela mais parecida com o que já existe no
CalendarSidebar).

O que fazer:
1. Criar src/components/calendar/MonthGrid.tsx — reaproveitando a lógica
   de getDaysInMonth/getFirstWeekdayOffset já usada no CalendarSidebar
   (mover esses helpers pra um lugar compartilhado se ainda não estão,
   tipo src/lib/date/calendar.ts, que já existe).
2. Cada dia da grade mostra os CalendarItem daquele dia (bolinha/tag
   colorida por type: mass = verde, event = roxo — seguir a paleta que
   já existe no AGENDA_MOCK do PainelPage como referência de cor).
3. Clicar num dia abre um painel lateral ou modal simples listando os
   itens completos daquele dia (reaproveitar o padrão visual da
   CalendarSidebar/agenda lateral que já existe no dashboard).
4. Botões do header da página: "Nova Missa" e "Novo Evento" (SEM "Novo
   Sacramento", removido por decisão já tomada) — por enquanto só abrem
   um modal vazio, os formulários reais ficam pro Dia 4.

Gere o componente da grade mensal + a página /calendario usando ele.
```

**Teste manual:**
- Acessar `/calendario`, ver a grade do mês atual com os itens reais vindos do backend.
- Trocar de mês (setas) e confirmar que o `useCalendar` refaz a busca com o novo período.

---

### Dia 4 — Formulários "Nova Missa" e "Novo Evento"

```
Dia 4 do bloco Calendário. Dia 3 (grade mês) já feito.

Hoje: os modais de criação, usando os DTOs reais do backend como base
(CreateMassDto, CreateEventDto) — sem inventar campo que não existe.

O que fazer:
1. Modal "Nova Missa": title, dateTime (date+time picker), type
   (COMMON/SPECIAL), location, notes (opcional). POST /masses via Route
   Handler proxy nova (src/app/api/masses/route.ts precisa ganhar um
   método POST, hoje só tem GET).
2. Modal "Novo Evento": name, description (opcional), startDate,
   endDate (opcional), location, categoryId (opcional, buscar lista de
   Category via GET /categories pro select), massId (opcional, vínculo
   com Missa existente — RN002). POST /events via Route Handler nova
   (POST em src/app/api/events/route.ts).
3. Após criar com sucesso: invalidar a query ['calendar', ...] do React
   Query (queryClient.invalidateQueries) pra grade atualizar sozinha,
   sem reload manual.
4. Validação client-side básica (campos obrigatórios) ANTES de enviar,
   mas sem duplicar toda a lógica do class-validator do backend — só o
   suficiente pra não mandar request incompleto à toa.

Gere os 2 modais/formulários + os métodos POST que faltam nas Route
Handlers.
```

**Teste manual:**
- Criar uma Missa nova pelo modal → aparece na grade sem reload.
- Criar um Evento vinculado a uma Missa existente → aparece na grade,
  campo `massId` persistido (conferir via GET /events depois).

---

### Dia 5 — Visões Semana/Dia/Ano (se necessário) + revisão

```
Dia 5 (fechamento do Bloco 1 — Calendário). Dias 1-4 já feitos.

Hoje: avaliar se as visões Semana/Dia/Ano do Figma são realmente
prioritárias agora, ou se a visão Mês já resolve o suficiente pro uso
real da paróquia (perguntar antes de implementar as 3 visões extras —
pode ser trabalho jogado fora se não for usado no dia a dia).

Se confirmado que são necessárias:
1. Visão Semana: grade de 7 colunas com os itens do período.
2. Visão Dia: lista simples dos itens daquele dia (reaproveita o painel
   lateral do Dia 3).
3. Visão Ano: mini-grades de 12 meses, só indicando dias com item (sem
   detalhe), clicar leva pra visão Mês daquele mês.

Revisão final:
4. Rodar de ponta a ponta: criar Missa, criar Evento vinculado, navegar
   entre meses, confirmar que RN002 (Missa/Evento entidades separadas,
   vínculo opcional) está refletido corretamente na grade (evento
   vinculado não vira "a mesma coisa" que a missa, aparecem como 2 itens
   distintos no mesmo horário/dia se for o caso).
```

---

## BLOCO 2 — Comunidade

> Cobre: tabela de Comunicados (Announcement), cadastro de Álbuns, cadastro de Eventos (reaproveitando o modal do Bloco 1), listagem geral.

### Dia 1 — Tabela de Comunicados (Announcement) conectada

```
Dia 1 do bloco Comunidade. Bloco 1 (Calendário) concluído.

Hoje: a tabela de Comunicados na tela /comunidade, usando os endpoints
já existentes e paginados (GET /announcements, do
roadmap-filtros-paginacao.md).

O que fazer:
1. src/types/announcement.ts — espelhando o schema real (title, content,
   categoryId, status: DRAFT/PUBLISHED, imageUrl, authorId, createdAt).
2. src/app/api/announcements/route.ts — Route Handler proxy GET (com
   suporte a page/limit/search/sortBy/order repassados da query string).
3. src/hooks/useAnnouncements.ts — useQuery parametrizado por filtros.
4. Tabela na tela /comunidade: Data, Aviso (title), Tipo (categoria),
   Ações (Editar / Ocultar-Publicar).
5. Botão de alternar status (DRAFT <-> PUBLISHED): PATCH
   /announcements/:id via Route Handler nova, invalidando a query depois.

Gere os arquivos.
```

**Teste:**
```bash
curl "http://localhost:3000/announcements?status=PUBLISHED"
# (confirmar se o filtro por status já existe no backend hoje — se não
# existir, é um ajuste pequeno a pedir separado, não assumir que já tem)
```

---

### Dia 2 — Modal "Novo Aviso/Nova Notícia" (criar Announcement)

```
Dia 2 do bloco Comunidade. Dia 1 (tabela) já feito.

Hoje: o modal de criação — "Novo Aviso" e "Nova Notícia" são o MESMO
componente (já confirmado antes: mesma entidade Announcement).

O que fazer:
1. Formulário: title, content, categoryId (select vindo de GET
   /categories, tipo ANNOUNCEMENT), status (default PUBLISHED,
   conforme schema), imageUrl.
2. Campo imageUrl: por enquanto texto simples (URL), SEM upload de
   arquivo — upload real pro Announcement ainda não existe no backend
   (só Photo tem upload via R2). Deixar comentário no código sinalizando
   isso como próxima etapa possível, não implementar upload aqui.
3. authorId: NÃO expor no formulário — preenchido pelo backend a partir
   do usuário logado (já documentado assim).
4. POST /announcements via Route Handler nova, invalidando a query da
   tabela do Dia 1 após sucesso.

Gere o modal + o método POST na Route Handler.
```

---

### Dia 3 — Álbuns (cadastro + listagem simples)

```
Dia 3 do bloco Comunidade. Dia 2 (Announcements) já feito.

Hoje: cadastro de Álbum (RN003 — vínculo opcional com Evento).

O que fazer:
1. src/types/album.ts, src/app/api/albums/route.ts (GET+POST),
   src/hooks/useAlbums.ts.
2. Modal "Novo Álbum": title, description (opcional), eventId opcional
   (select vindo de GET /events).
3. Listagem simples de Álbuns na tela /comunidade (título + evento
   vinculado, se houver) — SEM upload de Photos ainda, isso é uma tela
   própria/bloco futuro (o backend já suporta via R2, mas a tela de
   Álbuns/Fotos no Figma ainda não foi enviada, conforme já registrado
   no roadmap original).

Gere os arquivos.
```

---

### Dia 4 — Cards do topo + revisão do bloco

```
Dia 4 (fechamento do Bloco 2 — Comunidade). Dias 1-3 já feitos.

Hoje: cards do topo da tela /comunidade + revisão geral.

1. Card "Próximos Eventos": reaproveitar o mesmo hook useEvents() já
   usado no Painel Admin.
2. Card "Notícias Publicadas": contagem de Announcement status=PUBLISHED
   (usar o total já paginado, se o filtro por status existir no backend;
   senão, contar no client a partir da lista — sinalizar como
   temporário).
3. Card "Fotos na galeria": pendente até termos hook de Photos (pode
   ficar mockado mais uma rodada, ou implementar se já fizer sentido
   nesse ponto — decidir junto).
4. Card "Itens ocultos": contagem de Announcement status=DRAFT (mesmo
   conceito do card 2).
5. Rodar de ponta a ponta: criar Comunicado, ocultar/publicar, criar
   Álbum vinculado a Evento, confirmar tudo refletindo nas listagens.
```

---

## BLOCO 3 — Escalas

> Cobre: registrar Escala (vinculada a Missa OU Evento, RN007), ver escalas do mês, respeitar escopo por pastoral (RN006/RN008).

### Dia 1 — Tabela de Escalas do mês conectada

```
Dia 1 do bloco Escalas. Bloco 2 (Comunidade) concluído.

Hoje: tabela "Escalas de [Mês]" na tela /escalas, usando GET /schedules
(já com filtros/paginação e escopo por pastoral prontos, dos roadmaps
de Auth Dia 6 e Filtros Dia 4).

O que fazer:
1. src/types/schedule.ts — Schedule (massId/eventId opcionais,
   pastoralId) + ScheduleAssignment (volunteerId, role) aninhado.
2. src/app/api/schedules/route.ts — Route Handler proxy GET, repassando
   filtros de período/massId/eventId/volunteerId + paginação.
3. src/hooks/useSchedules.ts.
4. Tabela: Data (via Mass.dateTime ou Event.startDate — o backend
   precisa devolver isso, confirmar se o findAll já faz include de
   mass/event ou se é preciso um ajuste pequeno no SchedulesService),
   Horário, Função/Ministério (via assignments), Membros escalados,
   Status (por enquanto fixo "Escalados" — conceito de "pendente" ainda
   não existe no schema, não inventar).
5. Coordenador de Pastoral: o front NÃO aplica filtro de pastoral
   nenhum — o backend já filtra sozinho (RN006/RN008). Só renderizar o
   que vier.

Gere os arquivos. Antes de gerar a tabela, confirme comigo se
GET /schedules hoje já devolve os dados de Mass/Event vinculados
(include) ou só os ids soltos — isso muda a coluna "Data/Horário".
```

---

### Dia 2 — Cards do topo (Missas do mês, Escalados, Membros Ativos)

```
Dia 2 do bloco Escalas. Dia 1 (tabela) já feito.

Hoje: os 3 cards que já têm dado claro no backend (deixando "Pendentes"
de fora até decidirmos o conceito, igual já sinalizado no roadmap
original).

1. Card "Missas do mês": useMasses() filtrado por mês corrente.
2. Card "Escalados": contagem de ScheduleAssignment do mês (via os
   Schedules já buscados no Dia 1 — somar assignments.length).
3. Card "Membros Ativos": GET /volunteers (criar hook useVolunteers()
   se ainda não existir) — contagem total (Volunteer não tem campo de
   "ativo/inativo" hoje, confirmar se contagem total já resolve ou se
   precisa desse campo novo no schema, não assumir).
4. Card "Pendentes": deixar mockado ou omitir por enquanto — pendência
   registrada, não implementar sem decisão.

Gere os cards conectados (exceto Pendentes).
```

---

### Dia 3 — Modal "Registrar Escala" (criação aninhada)

```
Dia 3 do bloco Escalas. Dia 2 (cards) já feito.

Hoje: o modal que usa o fluxo de criação aninhada já pronto no backend
(roadmap-schedule-aninhado.md) — POST /schedules com massId OU eventId
+ array de assignments no mesmo request.

O que fazer:
1. Formulário: seletor Missa OU Evento (RN007 — mutuamente exclusivo,
   já validar isso no client antes de enviar, além do backend já
   validar), depois uma lista dinâmica de atribuições (Voluntário +
   função), podendo adicionar/remover linhas antes de salvar.
2. Voluntário: select vindo de GET /volunteers.
3. Função: input de texto livre com sugestões (leitor, ministro da
   eucaristia, coroinha) — sem @IsEnum ainda, igual já decidido no
   roadmap-backend.md Dia 5.
4. POST /schedules via Route Handler nova (métod POST em
   src/app/api/schedules/route.ts), invalidando a query da tabela do
   Dia 1 após sucesso.
5. Tratar erro 403 (Coordenador tentando escalar Missa/Evento fora da
   pastoral dele, RN017) com mensagem clara no formulário, não só um
   erro genérico.

Gere o modal + o método POST na Route Handler.
```

---

### Dia 4 — Revisão final do Bloco 3 e do roadmap por módulo

```
Dia 4 (fechamento do Bloco 3 — Escalas, e desta leva de módulos).
Blocos 1-3 já feitos.

Hoje: revisão geral, sem feature nova.

1. Rodar as 3 telas (Calendário, Comunidade, Escalas) de ponta a ponta
   logado como cada um dos 3 cargos.
2. Confirmar RN007 (Missa XOR Evento) bloqueando corretamente no modal
   de Escala.
3. Confirmar RN006/RN008 (escopo por pastoral) refletido nas 3 telas
   sem o front precisar filtrar manualmente.
4. Voltar ao Painel Admin (dashboard) e ligar os cards que ficaram
   mockados (Escalas do mês, Avisos pendentes, Fotos na galeria) agora
   que os módulos existem de verdade — Sacramentos continua pendente de
   decisão de reinterpretação.
5. Listar o que falta mapear (Voluntários CRUD próprio, Pastorais CRUD,
   Usuários/Cargos CRUD, Álbuns/Fotos com upload, Login definitivo) como
   próximos blocos, aguardando Figma correspondente — igual já estava no
   roadmap original.
```

---

## Depois deste roadmap

- Fechar o Painel Admin (dashboard) com dados 100% reais.
- Telas ainda sem Figma: Voluntários, Pastorais, Usuários/Cargos, Álbuns/Fotos (upload), Login definitivo.
- Avaliar se `GET /calendar` (Bloco 1) precisa virar a base de um endpoint mais amplo `GET /dashboard/summary` (débito técnico já registrado na conversa deste roadmap) — reaproveitando a mesma lógica de agregação.
