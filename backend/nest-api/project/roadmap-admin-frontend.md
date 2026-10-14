# Roadmap — Front-end Admin (Next.js)

Repositório: (definir — provavelmente novo app Next.js, ou app router dentro do mesmo monorepo do site institucional — **confirmar antes do Dia 0**)
Pré-requisito: Backend (`nest-api`) com Auth+RBAC+CRUD completo — roadmaps `roadmap-backend.md`, `roadmap-auth.md`, `roadmap-upload-fotos.md`, `roadmap-filtros-paginacao.md`, `roadmap-schedule-aninhado.md`.

Fonte de design: [Figma — Portal Igreja](https://www.figma.com/design/79j7lN629ZZMF1VJ85gSEb/Portal-Igreja). Só as telas já exportadas/enviadas por você entram no roadmap — nenhuma tela é "inventada" por analogia. Conforme mais telas forem chegando, novos dias são adicionados.

## Telas recebidas até agora (referência)
1. **Painel Admin** (dashboard geral) — cards (missas hoje, escalas do mês, próximos eventos, sacramentos, avisos pendentes, fotos na galeria) + tabela "Últimas movimentações" + lista "Eventos" + mini calendário/agenda do dia lateral.
2. **Calendário** — visão semana/dia/mês/ano de Missas + Sacramentos + Eventos, com botões "Nova Missa" / "Novo Sacramento" / "Novo Evento".
3. **Comunidade** — cards (próximos eventos, notícias publicadas, fotos na galeria, itens ocultos) + lista "Próximos Eventos" + tabela de Avisos/Notícias (Announcement) com Editar/Ocultar.
4. **Escalas** (ex: "Escalas de Coroinhas") — cards (missas do mês, escalados, pendentes, membros ativos) + tabela de escalas do mês + botão "Registrar Escala" + dropdown "Relatórios".

## Decisões já tomadas (nesta conversa)
- **Stack**: Next.js, mesma stack do site institucional (front único ou app separado — **confirmar antes do Dia 0**, mas o código React/Next é o mesmo padrão dos dois).
- **Finanças**: o menu lateral do Figma tem "Finanças" (doações), mas RN013 diz que Doações/Campanhas são Fase 2. **Removida do roadmap do admin por enquanto** — não entra no menu nem em nenhuma tela até o escopo ser revisado.
- **Aviso = Notícia = Announcement**: os textos "Novo Aviso" / "Nova Notícia" / "Notícia" no Figma são todos a mesma entidade do backend (`Announcement`, RF013). O Figma é de ~4 meses atrás, então pequenas divergências de nomenclatura na tela serão ajustadas para bater com o schema real (`title`, `content`, `status: DRAFT/PUBLISHED`), sem inventar campo novo.
- **Cobertura**: este roadmap cobre só as 4 telas acima. Voluntários, Pastorais, Usuários/Cargos, Álbuns/Fotos e Login **ainda não têm tela no Figma enviada** — ficam de fora até chegarem.

## Pontos em aberto que vão aparecer nos prompts abaixo (não decidir sozinho)
- Login/guard de rota: nenhuma tela de login foi enviada ainda, mas sem ela não dá pra testar nenhuma tela protegida. Proposta: fazer uma tela de login **mínima e sem estilo definitivo** (só formulário funcional) no Dia 1, e trocar pelo design real assim que a tela do Figma chegar.
- Dashboard (Painel Admin) usa métricas agregadas (ex: "Missas hoje: 3", "Fotos na galeria: 23", "Últimas movimentações") que **não existem hoje como endpoint único no backend** — hoje temos só os CRUDs individuais. Cada dia abaixo que precisar disso vai perguntar: calcular no client (várias chamadas) ou pedir endpoint agregado novo no backend.
- "Últimas movimentações" (Painel Admin) parece ligado a AuditLog (RNF011) — a confirmar.

---

## Dia 0 — Setup do projeto admin + client de API

```
Vamos começar o front-end do admin (Next.js) do sistema paroquial.

Contexto: o backend (repo hchepli/nest-api) já tem Auth JWT + RBAC por
cargo (Admin Geral, Secretaria, Coordenador de Pastoral) e CRUD completo
das entidades. O admin vai consumir essa API.

Hoje: Dia 0 — setup do projeto e da camada de comunicação com a API.

O que fazer:
1. Confirmar comigo: é um projeto Next.js novo e separado do site
   institucional, ou uma route group (ex: /admin) dentro do mesmo projeto
   Next.js do site público? (pergunte antes de decidir, não presumir)
2. Estrutura de pastas do App Router para as telas já mapeadas:
   /painel (dashboard), /calendario, /comunidade, /escalas.
3. Criar um client de API central (ex: lib/api.ts ou similar) que:
   - Aponta pra base URL da API via variável de ambiente
     (NEXT_PUBLIC_API_URL ou equivalente).
   - Injeta o header Authorization: Bearer <token> quando o usuário
     estiver logado.
   - Trata erro 401 (token expirado/inválido) redirecionando pro login.
4. Definir onde o access_token fica guardado no client (cookie httpOnly
   via API route intermediária, vs localStorage) — sugerir as duas opções
   com prós/contras (segurança vs simplicidade) e perguntar antes de
   fixar, já que isso afeta toda a autenticação do admin.
5. Não criar telas ainda — só setup e client de API.

Me pergunte sobre os pontos 1 e 4 antes de decidir.
```

---

## Dia 1 — Layout base (sidebar + header) + guard de rota

```
Dia 1 do roadmap do admin. Dia 0 (setup + client de API) já feito.

Hoje: layout compartilhado de todas as telas do admin, baseado no Figma
(Painel Admin, Calendário, Comunidade, Escalas — as 4 telas já mostram o
mesmo layout ao redor).

O que fazer:
1. Sidebar fixa à esquerda, colapsável (o Figma mostra uma seta de
   colapsar no topo), com:
   - Bloco "Overview": Painel Admin, Calendário, Comunidade, Escalas.
   - Bloco "General": Configurações, Logout.
   - NÃO incluir "Finanças" (fora de escopo por enquanto, RN013).
2. Header fixo no topo: campo de busca (sem funcionalidade ainda, só
   input), ícone de notificação (sem funcionalidade ainda), bloco de
   usuário logado (nome + e-mail vindos do usuário autenticado, não
   hardcoded).
3. Guard de rota: todas as telas dentro do grupo do admin exigem usuário
   autenticado (token válido); se não autenticado, redireciona pro login.
4. Tela de login MÍNIMA (sem estilo do Figma ainda, porque essa tela não
   foi enviada): formulário simples de e-mail + senha, chamando
   POST /auth/login, salvando o token conforme decidido no Dia 0.
   Trocaremos pelo design real assim que a tela de login do Figma
   chegar — não estilizar demais agora.
5. Logout: limpa o token e redireciona pro login.
6. Aplicar RBAC básico no menu: se no futuro algum item for restrito por
   cargo, deixar preparado (ex: função can(role, item)), mas não
   restringir nenhum item ainda — perguntar antes de esconder qualquer
   coisa do menu por cargo, já que isso não foi mapeado ainda pra essas
   4 telas.

Gere os componentes de layout (Sidebar, Header), o guard de rota, e a
tela de login mínima.
```

**Teste manual:**
- Acessar `/painel` sem estar logado → deve redirecionar pro login.
- Logar com usuário do seed (`admin@paroquia.org`) → deve entrar e mostrar nome/e-mail reais no header.
- Clicar em Logout → volta pro login e `/painel` volta a bloquear.

---

## Dia 2 — Painel Admin (dashboard)

```
Dia 2 do roadmap do admin. Dia 1 (layout + login) já feito.

Hoje: a tela "Painel Admin" (dashboard geral), primeira tela do Figma.

Cards e listas da tela (conferir se bate com o Figma que te mandei):
- Card "Missas hoje" (contagem + horários do dia)
- Card "Escalas do mês" (contagem + "X pendente")
- Card "Próximos eventos" (contagem, "nos próximos 30 dias")
- Card "Sacramentos" (contagem, "esta semana")
- Card "Avisos pendentes" (contagem, "aguardando revisão")
- Card "Fotos na galeria" (contagem, "nos últimos 30 dias")
- Tabela "Últimas movimentações" (data, descrição, tipo, valor)
- Lista "Eventos" (próximos, com data)
- Mini calendário/agenda lateral com os compromissos do dia

ANTES de implementar: nem todos esses dados têm endpoint pronto no
backend hoje. Me ajude a decidir, item por item, entre:
(a) calcular no client, fazendo várias chamadas aos endpoints que já
    existem (ex: GET /masses filtrado por hoje, GET /events, etc.), ou
(b) pedir um endpoint agregado novo no backend (ex: GET /dashboard/summary)
    — isso seria trabalho novo no nest-api, fora deste roadmap de
    front-end, precisa ser planejado à parte.

Em especial:
- "Últimas movimentações" parece ser o AuditLog (RNF011) — confirmar
  antes de tentar ligar isso a alguma entidade específica.
- O card "Sacramentos" e o botão "Registrar Sacramento" fazem sentido
  (Sacrament já existe no backend), mas Sacrament não tem "data" —
  então "2 esta semana" do Figma pode não fazer sentido como está;
  perguntar como interpretar esse card antes de implementar.

Não codar ainda os cards que dependem de decisão em aberto — comece
pelos que já têm endpoint claro (Missas hoje, Próximos eventos) e liste
os que ficaram pendentes de decisão.
```

---

## Dia 3 — Calendário (Missas + Eventos + Sacramentos)

```
Dia 3 do roadmap do admin. Dia 2 (Painel Admin) já feito ou parcialmente
feito (itens pendentes de decisão registrados).

Hoje: a tela "Calendário", com visão Dia/Semana/Mês/Ano e os botões
"Nova Missa" / "Novo Sacramento" / "Novo Evento".

Pontos de atenção:
1. Não existe hoje no backend um endpoint único que devolva Missas +
   Eventos + Sacramentos juntos num formato de calendário. Perguntar:
   buscar os 3 endpoints (GET /masses, GET /events, GET /sacraments) em
   paralelo e mesclar no client, ou pedir endpoint agregado no backend?
   (mesma decisão do Dia 2, mas agora specificamente pro calendário)
2. Sacramento no schema não tem data/hora (é conteúdo institucional tipo
   "Batismo", "Crisma" — não um evento agendado). O card do Figma mostra
   "Sacramento" como um bloco de horário no calendário (ex: "10:00
   Sacramento"). Isso sugere que talvez o Figma esteja tratando
   "celebração de um sacramento" como um Evento vinculado a uma
   categoria "Sacramento", não a entidade Sacrament em si. Preciso que
   você confirme essa interpretação antes de eu montar o botão
   "Novo Sacramento" — pode ser que ele deva, na prática, criar um Event
   com category apontando pro tipo Sacramento, e não mexer na entidade
   Sacrament (que é a página estática "O que é o Batismo" do site
   público).
3. Biblioteca de calendário: sugerir opções (ex: FullCalendar, ou um
   componente próprio simples baseado em grid, já que o layout do Figma
   é bem específico) — perguntar antes de instalar dependência nova.
4. Os 3 modais/formulários "Nova Missa", "Novo Sacramento" (ver ponto 2),
   "Novo Evento" — usar os DTOs já existentes do backend (CreateMassDto,
   CreateEventDto) como base dos formulários, sem inventar campo que não
   existe no schema.

Não implementar nada do ponto 2 até eu confirmar a interpretação.
```

---

## Dia 4 — Comunidade (Avisos/Notícias = Announcement)

```
Dia 4 do roadmap do admin. Dia 3 (Calendário) já feito ou com pendências
registradas.

Hoje: a tela "Comunidade" — gestão de Announcement (Comunicados),
usando os endpoints já existentes (CreateAnnouncementDto/UpdateAnnouncementDto,
GET /announcements paginado/com busca, já feito no roadmap de
filtros/paginação).

O que fazer:
1. Cards do topo: "Próximos Eventos" (via GET /events), "Notícias
   Publicadas" (contagem de Announcement com status=PUBLISHED), "Fotos
   na galeria" (via Photo), "Itens ocultos" (Announcement com
   status=DRAFT, reaproveitando o mesmo conceito de "oculto" = rascunho
   não publicado — confirmar essa equivalência antes de fixar).
2. Botões "Novo Aviso" / "Nova Notícia" → mesmo formulário, ambos criam
   um Announcement (title, content, categoryId, status, imageUrl) — não
   duplicar componente, é a mesma entidade com o mesmo modal (conforme
   você confirmou nesta conversa).
3. Tabela de listagem: Data, Aviso (title), Tipo, Ações (Editar / Ocultar
   ou Publicar, alternando o status DRAFT/PUBLISHED via PATCH).
4. Upload de imagem do Announcement: usar o padrão de upload já definido
   no backend pra Photo (Cloudflare R2, roadmap-upload-fotos.md) — mas
   ATENÇÃO: hoje o upload real via R2 foi implementado só pra Photo
   (álbum de galeria), não pra Announcement.imageUrl. Perguntar se
   Announcement também deve subir imagem pro R2 (exigiria endpoint novo
   no backend) ou se por enquanto o campo imageUrl fica como texto/URL
   simples (sem upload de arquivo) até isso ser decidido.
5. Autoria (Announcement.authorId): já documentado no backend como
   preenchido automaticamente pelo usuário logado — não expor esse campo
   no formulário do front.

Não implementar upload de imagem do Announcement até eu confirmar o
ponto 4.
```

---

## Dia 5 — Escalas

```
Dia 5 do roadmap do admin. Dia 4 (Comunidade) já feito ou com pendências
registradas.

Hoje: a tela "Escalas" (Figma mostra "Escalas de Coroinhas" — sugere que
a tela é filtrável/agrupável por função/ministério, ex: Coroinhas,
Leitores, Ministros da Eucaristia).

O que fazer:
1. Cards do topo: "Missas do mês" (via GET /masses filtrado por mês),
   "Escalados" (contagem de ScheduleAssignment do mês), "Pendentes"
   (perguntar o que define "pendente" — não existe status assim no
   schema hoje: Schedule/ScheduleAssignment não têm campo de status.
   Confirmar se isso é algo a adicionar no backend, ou se "pendente"
   significa outra coisa, tipo missa sem escala vinculada ainda),
   "Membros Ativos" (contagem de Volunteer).
2. Botão "Registrar Escala" → usa o fluxo de criação aninhada já
   implementado (roadmap-schedule-aninhado.md): POST /schedules com
   massId/eventId + array de assignments (voluntário + função) no mesmo
   request.
3. Botão "Relatórios" (dropdown) → liga no endpoint de relatório de
   escalas (RF008/UC023, já com filtros/paginação do
   roadmap-filtros-paginacao.md Dia 4). Perguntar quais formatos de
   relatório o dropdown deve oferecer (a exportação CSV/PDF ainda está
   pendente no roadmap geral, marcada como "Ações personalizadas" —
   confirmar se entra aqui ou fica só como link pra tela de listagem
   filtrada por enquanto).
4. Tabela "Tabela de Escalas de [Mês]": Data, Horário, Função/Ministério,
   Membros escalados, Status. O "Status: Escalados" sugerido no Figma —
   confirmar se é só um texto fixo (toda escala criada = "Escalados") ou
   se depende do ponto 1 (pendente vs escalado).
5. Respeitar o escopo por pastoral (RN006/RN008): se o usuário logado for
   Coordenador de Pastoral, a tela já deve vir filtrada pela pastoral
   dele (o backend já filtra automaticamente no findAll — o front só
   precisa não tentar sobrepor esse filtro).

Não implementar os pontos 1 e 3 (pendente / formatos de relatório) até
eu confirmar.
```

---

## Dia 6 — Revisão + o que falta mapear

```
Dia 6 (fechamento desta primeira leva de telas). Dias 0-5 já feitos.

Hoje: revisão geral, sem feature nova.

1. Rodar as 4 telas de ponta a ponta logado como cada um dos 3 cargos
   (Admin Geral, Secretaria, Coordenador de Pastoral), conferindo que
   nenhuma tela quebra por falta de permissão (backend retorna 403 em
   algum ponto não tratado no front?).
2. Revisar a lista de pendências acumuladas nos Dias 2-5 (endpoint
   agregado de dashboard, interpretação de "Sacramento" no calendário,
   upload de imagem em Announcement, conceito de "pendente" em Escalas)
   e decidir juntos quais viram tarefa formal no roadmap do backend.
3. Conferir responsividade básica (RNF001/RNF002) mesmo sendo painel
   admin — pelo menos não quebrar em tablet.
4. Listar as telas que ainda faltam (Voluntários, Pastorais, Usuários/
   Cargos, Álbuns/Fotos, tela de Login definitiva) como próximos blocos,
   aguardando o Figma correspondente.
```

---

## Próximos blocos (aguardando Figma)

- Login definitivo (hoje só a versão mínima do Dia 1)
- Voluntários (CRUD)
- Pastorais (CRUD, restrito por cargo — RN006)
- Usuários/Cargos (CRUD, só Admin Geral — RN004/RN005)
- Álbuns/Fotos (upload via R2, já com backend pronto)
- Configurações (tela existe no menu, mas ainda sem conteúdo definido)

Cada bloco novo entra como uma nova seção deste roadmap assim que a tela correspondente do Figma for enviada.
