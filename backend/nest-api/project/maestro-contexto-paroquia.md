# MAESTRO — Índice de Contexto do Projeto Paroquial

> Este é o ÚNICO arquivo que deve ser aberto no início de cada conversa.
> Ele resume o que já está decidido e diz QUAL outro arquivo abrir (e só
> ele) quando surgir uma dúvida específica. Não abrir os outros 4 arquivos
> "por precaução" — só quando este documento apontar pra eles.

---

## 1. Stack (resumo — não precisa abrir nada pra confirmar isso)

- **Front-end:** Next.js (público + admin, mesmo projeto/padrão)
- **Back-end:** NestJS (repo: `hchepli/nest-api`) — considerado confirmado
  nesta fase (roadmap já trata como fechado; se algo indicar mudança, avisar)
- **Banco real:** PostgreSQL via Prisma (`schema.prisma`)
- **Banco de referência visual:** `schema_modelagem_mysql.sql` (só pra
  modelagem/EER — não é o banco real, é espelho pra visualização)

---

## 2. Entidades do sistema e onde cada uma vive

| Entidade | Contexto geral | Regras (RF/RNF/RN) | Casos de uso | Schema (.sql) |
|---|---|---|---|---|
| Usuário / Cargo | contexto §4.1 | RF001-005, RN004-006 | UC001-007 | `usuarios`, `cargos`, `permissoes` |
| Voluntário | contexto §4.4 | RF006, RN009 | UC008-010 | `voluntarios` (+ `pastoralGroupId` — ver roadmap Bloco 1) |
| Missa | contexto §3.3/§4.2 | RF009, RF011, RN002 | UC011-014 | `missas` |
| Evento | contexto §3.4/§4.3 | RF010-012, RN002-003, RN012 | UC015-019 | `eventos`, `confirmacoes_presenca` |
| Escala | contexto §4.4 | RF007-008, RN007-008, RN016 | UC020-023 | `escalas`, `escala_atribuicoes` |
| Comunicado | contexto §3.2/§4.5 | RF013 | UC024-026 | `comunicados` |
| Galeria (Álbum/Foto) | contexto §3.6/§4.5 | RF014-017, RN003, RN010 | UC027-030 | `albuns`, `fotos` |
| Sacramento | contexto §3.5/§4.5 | RF018 | UC031-032 | `sacramentos` |
| Pastoral | contexto §3.7/§4.5 | RF019, RN006 | UC033-034 | `pastorais` |
| Contatos/Sobre Nós | contexto §3.9/§3.8 | RF023, RN011 | UC037 | não tem tabela (hardcoded no front) |
| Doações/Campanhas | fora de escopo MVP | RF020-022, RN013 | — | não existe ainda (Fase 2) |
| Área do Paroquiano | fora de escopo MVP | RF024, RN014 | — | não existe ainda (Fase 4) |

---

## 3. Mapa de decisão — "tenho dúvida sobre X, abro qual arquivo?"

| Dúvida é sobre... | Abrir |
|---|---|
| Nome de tabela, coluna, tipo de campo, FK, constraint | `schema_modelagem_mysql.sql` |
| Se uma regra é validada no banco ou no service | `schema_modelagem_mysql.sql` (tem comentários explícitos disso) |
| Se algo está no MVP ou em fase futura | Seção 6 deste maestro primeiro; se não bastar, `Requisitos_e_Regras_de_Negocio` |
| Fluxo passo a passo de uma ação (ex: "o que acontece ao remover X") | `casos-de-uso-sistema-paroquial.md` |
| Quem pode fazer o quê (permissão por cargo) | Seção 5 deste maestro primeiro; se faltar detalhe, `Requisitos_e_Regras_de_Negocio` |
| Visão geral de página do site público (o que ela mostra) | `contexto-projeto-paroquia.md` |
| O que já foi decidido/travado no desenvolvimento atual, próximo passo | `roadmap-consolidado-pos-modulos.md` |
| Código real existente (controller, service, dto) | Perguntar ao usuário — ele cola o arquivo, não está em nenhum doc do projeto |

Regra geral: comece por este maestro. Só abra o arquivo apontado na tabela
acima se a resposta não estiver nas seções 4-7 abaixo.

---

## 4. Regras de Negócio mais citadas (cheat sheet — não precisa abrir o RN doc)

- **RN002** — Missa e Evento são entidades separadas; vínculo opcional entre elas.
- **RN003** — Álbum pode ser avulso ou vinculado a Evento.
- **RN006** — Coordenador de Pastoral está vinculado a exatamente 1 Pastoral (1:N).
- **RN007** — Escala vincula a Missa OU Evento, nunca ambos, nunca nenhum (validado em SERVICE, não em constraint de banco).
- **RN008** — Relatório de Escala: Admin Geral/Secretaria veem tudo; Coordenador só da própria pastoral.
- **RN009** — Voluntário não é usuário, não tem login.
- **RN010** — 1 Foto pertence a exatamente 1 Álbum; capa única validada em SERVICE.
- **RN011** — Contatos/Sobre Nós são hardcoded, sem CRUD.
- **RN012** — "Garantir Presença" é só informativo, não reserva lugar.
- **RN013/RN014** — Doações e Área do Paroquiano fora do escopo atual (Fase 2 e Fase 4).
- **RN016** — Excluir Missa/Evento com Escala vinculada exige aviso + confirmação extra (cascata).
- **RN017 (proposta, ainda não em produção no schema.prisma real)** — Missa/Evento pode ter várias Pastorais vinculadas (N:N); Coordenador só escala se sua Pastoral estiver entre as vinculadas. Ver Bloco 3 do roadmap.

---

## 5. Cargos e permissões (resumo)

- **Admin Geral** — acesso total.
- **Secretaria** — comunicados, eventos, missas, calendário, sacramentos, galeria. Sem gestão de usuários nem escalas de outras pastorais (mas pode tudo em Escalas de modo geral, conforme UC020-023).
- **Coordenador de Pastoral** — restrito à própria Pastoral (conteúdo + escalas). RN006.
- **Visitante** — site público, sem login.

---

## 6. O que está fora do MVP atual (não implementar sem confirmar)

- Doações / Campanhas de Arrecadação (Fase 2)
- Área de acesso do fiel/paroquiano, incluindo login/cadastro público (Fase 4)
- 2FA no login do admin (fase futura — MVP é login simples)
- Cadastro público de paroquiano (não existe, exceto "Garantir Presença", que é leve e sem login)

---

## 7. Status atual do desenvolvimento (roadmap)

- Pré-requisito: Blocos 1-3 do `roadmap-admin-modulos.md` (Calendário, Comunidade, Escalas) — **considerar concluídos**.
- Roadmap ativo: `roadmap-consolidado-pos-modulos.md`, com 9 blocos:
  1. Voluntário ↔ Pastoral (1:N)
  2. Auditoria automática (AuditLog)
  3. Vínculo Pastoral em Missa/Evento (RN017 proposta)
  4. Card "Pendentes" em Escalas (depende do 3)
  5. Missas Recorrentes (isolado)
  6. Edição de Missa/Evento pelo Calendário
  7. Páginas de gestão dedicadas (Galeria, Eventos, Comunicados)
  8. Fechar cards restantes do Painel Admin (depende de 2 e 4)
  9. Modais → Páginas completas (por último)
- Decisões travadas (não reabrir sem avisar): ver seção "Decisões já travadas"
  do roadmap-consolidado — resumo: Voluntário é 1:N com Pastoral (não N:N),
  Auditoria via interceptor global + decorator `@Auditable`, Missas
  Recorrentes geradas fisicamente via "carona" no GET /calendar (sem cron).
- **Bloco/Dia em execução agora:** _(atualizar aqui manualmente a cada sessão,
  me diga em qual Bloco/Dia estamos)_

---

## 8. Como manter este arquivo útil

- Sempre que uma decisão nova for travada (RN nova, mudança de cargo,
  campo novo confirmado), atualizar a seção correspondente aqui — não só
  no arquivo de origem.
- Se este maestro e um arquivo de origem conflitarem, o arquivo de origem
  vence (este é resumo, não substitui os documentos), mas o conflito deve
  ser sinalizado pra atualizar o maestro.
