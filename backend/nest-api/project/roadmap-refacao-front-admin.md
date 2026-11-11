# Roadmap — Refação do Front Admin (UX/UI + Revisão por Módulo)

Repositório back: https://github.com/hchepli/nest-api
Repositório front: Next.js admin
Pré-requisito: Bloco 2 do `roadmap-backend-pratico-revisao-modulos.md` concluído.
**Pausa:** Bloco 3 (PostgreSQL + Prisma) retoma ao final deste roadmap.

Cada Dia é um prompt pronto pra colar no início da sessão, seguido de um checklist (☐). Só marque ☐ quando conseguir fazer o item sem pedir pra IA.

---

## Decisões já travadas nesta etapa (não reabrir sem avisar)

- **Linguagem simples para idosos:** todo texto visível ao usuário usa palavras simples. "Comunicados" vira **"Avisos"** em TODA a interface.
- **Página `/comunidade` sai.** Entram páginas próprias por entidade: **Álbuns, Avisos, Eventos**, cada uma com sua gestão completa (tabela + filtros + ações).
- **Finanças da imagem do Figma é só exemplo de navegação.** Ignorar a tela. Doações/Finanças seguem fora do MVP (RF020-022, RN013).
- **Navegação do Figma é a referência (inclui "Pessoas" e "Configurações"):** menu lateral agrupado em seções (Início / Dia a dia da paróquia / Comunicação / Administração / Geral).
- **Componentização é decisão sua.** A IA apenas **aponta candidatos** e propõe opções; você diz o que fazer e como. Nenhum componente compartilhado é criado/alterado sem sua instrução.
- **Componentes de layout (Card, Nav/Sidebar, Header) devem ser reutilizáveis em outros admins** — não amarrar à paróquia (nome, logo, rotas, cargos entram por props/config).
- **Relatório antes de alterar:** em todo módulo a IA entrega achados primeiro; você decide o que priorizar.

## Decisões fechadas após revisão (antes em aberto)

1. **Renomeação só no front.** Back e banco continuam com o nome atual (`Announcement`/`comunicados`, endpoints sem mudança). No front mudam o texto da tela e as rotas (`/avisos`). Os hooks, types e Route Handlers que falam com o back continuam apontando para os endpoints atuais; a tradução "Comunicado → Aviso" acontece só na camada de apresentação.
2. **"Pessoas"** = gestão de Usuários + Voluntários na mesma área (duas abas ou duas seções). Admin Geral vê as duas; Secretaria vê só Voluntários (as permissões de Usuários seguem RN004/RN005); Coordenador de Pastoral vê só Voluntários da própria pastoral. **"Configurações"** = configuração do sistema; fica no menu, mas a tela só será construída no final (por enquanto, página "Em breve").
3. **Componentes reutilizáveis** ficam em `src/components/ui`. Quando evoluírem, você os extrai para uma lib própria; por isso nada em `ui` pode importar hooks, types ou rotas do projeto.

## Glossário de linguagem simples (ponto de partida — você completa)

| Hoje (complicado) | Proposta (simples) |
|---|---|
| Comunicados | Avisos |
| Comunidade | (sai; cada item vira página própria) |
| Escala | Escala (manter) — ou "Quem serve na missa"? *(decidir)* |
| Voluntário | Voluntário (manter) — ou "Ajudante"? *(decidir)* |
| Pastoral | Pastoral (manter, termo conhecido) |
| Sacramentos | Sacramentos (manter, termo conhecido) |
| Cargo / Perfil de acesso | "Função" ou "Tipo de acesso" *(decidir)* |
| Inativar | Desativar |
| Cascata / dependências | "Isto também apagará: …" |
| Slug, ISR, status DRAFT, RASCUNHO | Não aparecer pro usuário (ou "Rascunho" → "Ainda não publicado") |
| Logs de auditoria / Movimentações | "Últimas alterações" |
| Confirmar presença | "Garantir presença" (já está ok) |
| Publicar / Ocultar | Mostrar no site / Esconder do site |

Regras gerais de texto: frases curtas, verbo no começo do botão ("Salvar", "Criar aviso"), mensagens de erro dizendo **o que fazer** (não só o que deu errado), nada de siglas, nada de inglês na tela.

---

## Eixos de revisão (usados em TODO módulo)

1. **Linguagem simples** (textos, botões, mensagens de erro/sucesso, placeholders)
2. **UX do fluxo** (quantos cliques, o usuário sabe onde está e o que fazer, confirmações antes de apagar)
3. **UI** (consistência visual com o Figma, espaçamento, hierarquia, contraste, tamanho de fonte legível para idosos)
4. **Estados** (loading, vazio, erro, sucesso)
5. **Hooks** (`useX`): responsabilidade, chaves de cache do React Query, invalidação, duplicação
6. **Types** (tipos do módulo): duplicados, `any`, divergência com o DTO do back
7. **Libs** (o que o módulo usa: forms, validação, datas, ícones, tabela): consistência entre módulos
8. **Components** (do módulo): o que é específico, o que se repete em outros módulos (candidato a componentizar)
9. **API do app** (`app/api`, Route Handlers): padrão de erro, repasse de token, validação, duplicação entre rotas
10. **Permissões na tela** (o que cada cargo vê/pode clicar — RN004/RN005/RN006)
11. **Responsividade e acessibilidade** (tablet/mobile, teclado, foco, alt text)
12. **Roteiro de teste manual** (UCs do módulo × cargos aplicáveis)

---

# FASE 0 — Levantamento (sem código)

### Dia 0.1 — Suas anotações

```
Fase 0, Dia 0.1 do roadmap-refacao-front-admin.md.

Vou despejar TODAS as anotações do que quero mudar no front admin, sem
filtro e sem ordem. Organize por tema (navegação, layout, linguagem,
componentes, fluxos, telas específicas), aponte conflitos entre elas e
com as decisões travadas do roadmap, e devolva uma lista limpa.
NÃO propor solução ainda, só organizar.

[Colar aqui as anotações]
```

### Dia 0.2 — Inventário do front atual

```
Dia 0.2. Vou colar:
1. A árvore de src/ (app, components, hooks, types, lib, services).
2. O conteúdo de src/app/api (lista de Route Handlers).
3. O package.json.

Me devolva:
- Mapa de rotas atuais x rotas do Figma (o que sai, o que entra, o que muda de nome).
- Lista das libs usadas e para quê cada uma (e se há duas libs fazendo a mesma coisa).
- Lista de hooks, types e components agrupados por módulo, apontando os
  que parecem compartilhados entre módulos.
- Lista de TODOS os textos "difíceis" encontrados (varredura por
  "Comunicado", jargões, siglas, inglês na tela) para o glossário.
Só relatório. Não alterar nada.

[Colar aqui]
```

### Dia 0.3 — Arquitetura de navegação

```
Dia 0.3. Com o inventário pronto, desenhar a navegação final:
1. Seções e itens do menu (base: Figma — Início / Dia a dia / Avisos e
   fotos / Administração / Geral), ordem e ícones.
2. Visibilidade por cargo (Admin Geral, Secretaria, Coordenador de
   Pastoral) — montar uma tabela item x cargo.
3. "Pessoas" (Usuários + Voluntários, visibilidade por cargo) e "Configurações" (item no menu, página "Em breve") — já decididos, só desenhar.
4. Breadcrumbs / "Voltar" (já existe do Bloco D do roadmap de qualidade):
   continua, muda ou some com a nova navegação?
5. Comportamento mobile/tablet do menu (recolher, drawer).
6. Rotas novas: /avisos, /eventos, /albuns, /pessoas, /configuracoes (front apenas; endpoints do back não mudam).
Apresente opções com prós e contras onde houver dúvida e AGUARDE minha
confirmação. Não gerar código.
```

**Checklist da Fase 0**
- ☐ Anotações organizadas e sem conflito
- ☐ Mapa de rotas atuais → novas aprovado
- ☐ Glossário de linguagem simples fechado
- ☐ Tabela menu × cargo aprovada
- ☐ Rotas e menu (incluindo Pessoas e Configurações) aprovados

---

# FASE 1 — Base compartilhada (layout reutilizável)

> **Aqui o foco é seu.** A IA lê o código atual e descreve como está; VOCÊ diz como quer que fique. Pensar nos componentes como "kit de admin" reutilizável: nada de nome da paróquia ou regra de cargo fixa dentro deles.

### Dia 1.1 — Leitura do layout atual (Sidebar/Nav, Header, Card, Layout)

```
Fase 1, Dia 1.1. Vou colar o código atual de Sidebar/Nav, Header, Card
e do layout raiz do admin. Descreva, sem propor mudança:
1. Como cada um está estruturado (props, estado, dependências).
2. O que está amarrado ao projeto da paróquia (textos, logo, rotas,
   cargos) e que impediria reuso em outro admin.
3. Onde há variações do mesmo componente copiadas em telas diferentes
   (ex: 3 tipos de card parecidos).
Depois PARE e aguarde. Eu vou dizer o que mudar e como.

[Colar aqui]
```

### Dia 1.2 — Implementação conforme minhas instruções

```
Dia 1.2. Seguem minhas instruções de como componentizar Sidebar, Header
e Card (colar abaixo). Implemente exatamente o que descrevi; se algo
estiver ambíguo ou conflitar com outra parte do código, pergunte antes.
Mostrar um exemplo de uso isolado de cada um, sem migrar telas ainda.

[Colar aqui as instruções]
```

### Dia 1.3 — Tokens visuais e inputs

```
Dia 1.3. Levantar o que existe de cores, tipografia, espaçamento e
raios (Tailwind config / CSS vars) e dos inputs componentizados
(TextInput, SelectInput, etc.). Apontar inconsistências e propor
tokens mínimos, incluindo tamanho de fonte base maior e contraste
reforçado para idosos. AGUARDAR minha decisão antes de alterar.
```

### Dia 1.4 — Aplicar o novo layout + menu

```
Dia 1.4. Aplicar o layout novo (Sidebar com seções, Header) no admin,
com o menu aprovado no Dia 0.3 e visibilidade por cargo. Rotas antigas
(/comunidade e filhas) continuam funcionando até a Fase 2 migrar cada
uma; mostrar o plano de redirecionamento antes.
```

**Checklist da Fase 1**
- ☐ Sidebar, Header e Card não têm nada específico da paróquia dentro
- ☐ Menu muda conforme o cargo (testei com os 3)
- ☐ Sei explicar a API (props) de cada componente de layout
- ☐ Tokens visuais registrados em um só lugar

---

# FASE 2 — Revisão por módulo (UX + UI + código do front)

## Template padrão (reaproveitado em cada Dia abaixo)

```
Revisão do front do módulo [NOME] (roadmap-refacao-front-admin.md, Fase 2).

Vou colar: páginas/rotas do módulo, components, hooks, types, os Route
Handlers em app/api usados por ele e um print da tela atual (e do Figma,
se existir).

FASE 1 — Entender: me peça pra EU explicar o fluxo do usuário nesse
módulo (o que ele vê, clica, e o que acontece até o dado chegar no back).

FASE 2 — Investigar: relatório (SEM alterar nada) organizado pelos 12
eixos do roadmap: 1 linguagem simples, 2 UX do fluxo, 3 UI, 4 estados,
5 hooks, 6 types, 7 libs, 8 components, 9 API do app, 10 permissões na
tela, 11 responsividade/a11y, 12 roteiro de teste manual.
+ pontos específicos deste módulo (abaixo).

FASE 3 — COMPONENTIZAÇÃO: listar candidatos (o que se repete aqui e em
outros módulos), SEM criar nada. Eu decido o que componentizar e como.

FASE 4 — Eu decido a prioridade. Só então implementar.

Pontos específicos:
[ver cada Dia]

[Colar aqui os arquivos do módulo]
```

## Checklist de conclusão padrão (vale pra cada módulo)

- ☐ Textos revisados com o glossário (nada difícil, nada em inglês na tela)
- ☐ Fluxo principal faz sentido pra uma pessoa idosa sem treinamento
- ☐ Loading, vazio, erro e sucesso existem e têm texto claro
- ☐ Hooks, types e Route Handlers do módulo revisados (sem `any`, sem duplicação desnecessária)
- ☐ Candidatos a componente listados e minhas decisões registradas
- ☐ Menu e botões respeitam o cargo
- ☐ Funciona em tablet e celular
- ☐ Roteiro de teste manual executado
- ☐ Registrei no quadro de aprendizado o que mudou e por quê

---

### Dia 2.1 — Login e estrutura de acesso
**Pontos específicos:** tela de login (mensagem de erro simples, sem revelar se e-mail ou senha, UC007), mensagem de usuário desativado, expiração de sessão (o que o usuário vê quando o token vence), redirecionamento pós-login conforme o cargo, Route Handlers de auth (cookies/token).

### Dia 2.2 — Início (Painel)
**Pontos específicos:** cards clicáveis, "Últimas alterações" (antes "Últimas movimentações") com scroll interno, resumo do mês, agenda lateral. Cada card leva pra página dedicada. Atenção ao card "Sacramentos" (decisão pendente do Bloco 8 do roadmap consolidado). Nada de Finanças.

### Dia 2.3 — Missas e Calendário
**Pontos específicos:** calendário mensal, painel lateral do dia, modal/página de criar e editar Missa (confirmar se o modal é o mesmo componente no Painel e no Calendário), Missa recorrente ("Repetir toda semana" em vez de "recorrente"), aviso ao apagar missa com escala (RN016 em frase simples), Coordenador sem acesso a criar/editar.

### Dia 2.4 — Eventos (página própria, sai de /comunidade)
**Pontos específicos:** nova rota `/eventos`, `<GenericTable />`, categorias, Pastorais vinculadas, "Garantir presença" (lista de quem confirmou, UC036), status Ativo/Cancelado em linguagem simples, tela de criar evento.

### Dia 2.5 — Escalas
**Pontos específicos:** módulo mais crítico para o usuário. Tela de criar escala (escolher Missa **ou** Evento, de forma óbvia), seleção de voluntário filtrada por pastoral, função pré-preenchida, card "Pendentes" ("Falta escalar"), aviso de voluntário duplicado em frase clara, relatório. Teste com os 3 cargos.

### Dia 2.6 — Voluntários e Pastorais
**Pontos específicos:** formulário com Pastoral obrigatória, bloqueio do Coordenador cadastrar fora da própria Pastoral (mensagem simples, não "403"), `defaultRole` com nome amigável ("Função padrão"), aviso ao remover voluntário que está em escalas futuras. Voluntários passam a viver dentro da área "Pessoas" (ao lado de Usuários, que o Dia 2.10 trata).

### Dia 2.7 — Avisos (página própria, antes "Comunicados")
**Pontos específicos:** nova rota `/avisos`, renomear TODA a interface, "Rascunho" → "Ainda não publicado", Publicar/Ocultar → "Mostrar no site"/"Esconder do site", upload de imagem com limite explicado em frase simples (RNF008), editor de texto simples (idoso consegue usar?), tabela com `<GenericTable />`.

### Dia 2.8 — Álbuns (página própria)
**Pontos específicos:** nova rota `/albuns`, criação sem erro, envio de várias fotos com resultado claro por foto (as aceitas e as recusadas, com motivo), escolher foto de capa, vínculo opcional com evento, apagar álbum avisando quantas fotos serão apagadas.

### Dia 2.9 — Sacramentos
**Pontos específicos:** CRUD simples, ordem de exibição (arrastar ou setas? — mais simples para o público), campo de perguntas frequentes (`faq`) em formulário amigável em vez de JSON, "Documentos necessários".

### Dia 2.10 — Usuários e Funções (Cargos), dentro de "Pessoas"
**Pontos específicos:** só Admin Geral vê a parte de Usuários; a área "Pessoas" mostra só Voluntários para Secretaria e Coordenador. "Cargo" → palavra simples (glossário), "Inativar" → "Desativar", trava de não desativar o único Admin Geral com mensagem clara, regras de senha explicadas antes do erro, campo Pastoral que só aparece para Coordenador.

### Dia 2.11 — Últimas alterações (Auditoria) e Configurações
**Pontos específicos:** lista de auditoria com frases humanas ("Maria criou o aviso X" em vez de `CREATE em Announcement`), filtros simples, sem dados sensíveis na tela; Configurações: só a página "Em breve" no menu; o conteúdo real fica para o final do projeto.

---

# FASE 3 — Camada transversal

### Dia 3.1 — Route Handlers (`app/api`) e camada de dados

```
Fase 3, Dia 3.1. Com todos os módulos revisados, olhar a camada de dados
como um todo (vou colar a lista de Route Handlers, a lib de fetch/axios
e os hooks base):
1. Padrão único de erro (mensagem simples para o usuário + detalhe técnico no log).
2. Repasse de token e tratamento de 401 (sessão vencida) em um só lugar.
3. Duplicação entre rotas e entre hooks (candidatos a um helper comum).
4. Chaves do React Query e invalidação consistentes.
Relatório + candidatos. Eu decido o que centralizar.
```

### Dia 3.2 — Types e libs

```
Dia 3.2. Consolidar types (um lugar por entidade, alinhados com os DTOs
do nest-api, sem `any`) e revisar libs duplicadas ou subutilizadas.
Relatório primeiro; aguardar minha decisão.
```

### Dia 3.3 — Revisão geral de UX

```
Dia 3.3. Revisão ponta a ponta, logado como os 3 cargos:
1. Varredura final de linguagem (sobrou "Comunicado", jargão ou inglês?).
2. Navegação: dá pra chegar em qualquer tela em até 2 cliques do menu?
3. Responsividade e acessibilidade (teclado, foco, contraste, tamanho de fonte).
4. Estados de loading/vazio/erro em todas as telas.
Gerar relatório e roteiro de teste final.
```

### Dia 3.4 — Fechamento

```
Dia 3.4. Atualizar maestro-contexto-paroquia.md e contexto-projeto-paroquia.md
com: nova navegação, rotas /avisos /eventos /albuns, glossário de
linguagem simples, componentes reutilizáveis de layout e decisões
tomadas. Depois, marcar este roadmap como concluído e retomar o
Bloco 3 (PostgreSQL + Prisma) do roadmap-backend-pratico-revisao-modulos.md.
```

**Checklist da Fase 3**
- ☐ Um padrão único de erro e de sessão vencida
- ☐ Types sem `any` e alinhados com o back
- ☐ Nenhum "Comunicado" ou jargão restante na interface
- ☐ Maestro e contexto atualizados
- ☐ Pronto para retomar o Bloco 3

---

## Resumo da ordem (dependências)

```
Fase 0 (levantamento) ─> Fase 1 (layout/menu reutilizável)
        │
        └─> Fase 2 (módulos; ordem sugerida, pode mudar)
              2.1 Login ─> 2.2 Início ─> 2.3 Missas/Calendário
              2.4 Eventos / 2.7 Avisos / 2.8 Álbuns  (substituem /comunidade)
              2.5 Escalas (depois de 2.3 e 2.4, pois depende de Missa/Evento)
              2.6 Voluntários/Pastorais ─ antes ou junto de 2.5
              2.9 Sacramentos, 2.10 Usuários, 2.11 Auditoria/Config
        │
        └─> Fase 3 (camada transversal + fechamento) ─> volta ao Bloco 3 do roadmap backend
```

**Sugestão de execução:** Dia 0.1 (você manda as anotações) → Dia 0.2 (árvore de `src/` e `app/api`) → Dia 0.3 (menu final). Só depois entrar em código.

---

## Quadro de aprendizado (preencher ao fim de cada módulo)

| Módulo | Textos trocados | O que componentizei (e como decidi) | Hooks/Types/API ajustados | Pendências |
|---|---|---|---|---|
| | | | | |
