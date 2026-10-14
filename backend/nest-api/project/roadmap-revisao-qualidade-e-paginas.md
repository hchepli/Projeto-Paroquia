# Roadmap — Revisão de Qualidade por Módulo + Ajustes de Páginas

Repositório back: https://github.com/hchepli/nest-api
Repositório front: Next.js admin (mesmo projeto dos roadmaps anteriores)
Pré-requisito: `roadmap-consolidado-pos-modulos.md` (Blocos 1-9) concluído.

Cada dia abaixo é um prompt pronto pra colar no início da sessão. Cole o prompt do dia, cole o resultado dos comandos/arquivos que eu pedir, e seguimos.

Este roadmap tem duas partes:
- **Parte 1 (Blocos A-I):** ajustes pontuais de páginas já existentes, reportados diretamente por você.
- **Parte 2 (Blocos J-Q):** revisão de qualidade por módulo (consistência com RN, duplicação, código morto, erro/loading, roteiro de teste manual).

## Decisões já travadas nesta etapa

- **Tabela genérica**: será criada do zero (não existe ainda) e vai **substituir** as tabelas específicas hoje usadas em Eventos, Comunicados e Álbuns. Roda no Bloco A, antes dos blocos que dependem dela (F, G, H).
- **Header "Voltar" nas sub-telas**: aplica-se a toda tela de criação e a toda página dentro de `/comunidade`. Vira um Bloco transversal isolado (D), mas pode ser feito em paralelo a B/C.
- **"Último card" de Eventos, Álbuns e Escalas**: o funcionamento novo de cada um **ainda não está definido** — a decisão será tomada no próprio Dia do bloco correspondente, na hora. Não gerar código de card algum antes de eu confirmar o comportamento esperado naquele momento.
- **Erro ao criar Álbum**: bug real ainda sem repro anexado. Reservado um Dia específico no Bloco H só pra isso — o prompt daquele dia já vem com uma observação pedindo o print/erro antes de continuar.
- **Erros de navegação em Comunidade**: não há lista fechada. O Dia do Bloco E começa mapeando os botões/rotas atuais antes de corrigir, em vez de assumir uma lista pré-definida.
- **Animações/microinterações**: fora deste roadmap por enquanto. Serão tratadas pontualmente quando surgirem, sem bloco dedicado.

## Observações gerais (aplicam-se a todos os blocos)

> Sempre que um Dia mencionar um comportamento "a decidir", o prompt já vem com uma observação lembrando de perguntar antes de implementar, em vez de assumir.

---

# PARTE 1 — Ajustes de Páginas

## BLOCO A — Componente de Tabela Genérica

**Pré-requisito para os Blocos F, G e H.**

### Dia 1 — Levantamento das tabelas atuais

```
Bloco A do novo roadmap (ajustes de páginas): criar um componente de
Tabela Genérica que vai substituir as tabelas específicas hoje usadas em
Eventos, Comunicados e Álbuns.

Antes de desenhar a API do componente, preciso ver o que já existe.
Vou colar o código das 3 tabelas atuais (Eventos, Comunicados, Álbuns).
Analise e me diga:
1. Quais colunas/comportamentos são realmente comuns às 3 (paginação,
   busca, ordenação, ações por linha, empty state, loading state).
2. Quais diferenças entre elas parecem só estilo (fácil de generalizar)
   e quais parecem regra de negócio específica (não deveria virar prop
   genérica, e sim ficar de fora do componente).

[Colar aqui o código das 3 tabelas]
```

### Dia 2 — Implementação do componente

```
Dia 2 do Bloco A. Dia 1 (levantamento) já feito.

Hoje: implementar o componente <GenericTable /> (ou nome equivalente,
seguindo o padrão de nomenclatura já usado nos inputs componentizados —
TextInput, SelectInput, etc.) com:
1. Props para: colunas (label + render por coluna), dados, ações por
   linha (array de {label, onClick, variant}), estado de loading
   (skeleton), estado vazio (mensagem customizável), paginação (se
   aplicável nas 3 tabelas atuais).
2. Reaproveitar o padrão visual (cores, espaçamento, bordas) já usado
   na tabela de Escalas, que você validou ser o "padrão bonito" no
   roadmap anterior.
3. NÃO migrar nenhuma tabela específica ainda — só o componente isolado,
   com um exemplo de uso simples pra eu conferir visualmente.

Gere o componente.
```

**Teste manual:**
- Componente renderiza isolado (Storybook ou página de teste temporária) com dados mockados, loading e vazio.

---

## BLOCO B — Painel Admin

### Dia 1 — Cards clicáveis + "Ver Eventos"

```
Bloco B, Dia 1: Painel Admin.

1. Os cards do Painel Admin passam a ser clicáveis, navegando pra
   respectiva página (confirmar comigo o mapeamento card → rota antes
   de implementar, caso não esteja óbvio pelo nome do card).
2. Adicionar no canto superior direito do Painel um link/botão "Ir para
   Eventos" (ou nome equivalente ao contexto daquela seção) com ícone,
   deixando claro que é clicável — mesmo padrão visual que quiser
   sugerir, mas consistente com o resto do admin.

Antes de mexer, me confirme o mapeamento card → rota.
```

### Dia 2 — Modal de Missa (Visualizar/Update) + Action Button

```
Dia 2 do Bloco B.

1. Arrumar o modal de Missa no Painel: o modo Visualizar/Update está
   com problema (vou colar o componente atual e descrever o
   comportamento incorreto).
2. O Action Button do modal/card de Missa deve levar para a página de
   criação correspondente, em vez do comportamento atual.

[Colar aqui o componente do modal de Missa e descrever o bug]
```

### Dia 3 — Scroll na tabela de Últimas Movimentações

```
Dia 3 do Bloco B.

A tabela "Últimas Movimentações" do Painel precisa de scroll interno
(altura máxima fixa + overflow), pra não esticar o layout da página
quando tiver muitos registros.

Gere o ajuste de CSS/layout do componente da tabela.
```

**Teste manual:**
- Clicar em cada card do Painel → navega pra página certa.
- Abrir modal de Missa → visualizar e editar funcionam corretamente.
- Tabela de Últimas Movimentações com scroll, sem esticar a página.

---

## BLOCO C — Calendário

### Dia 1 — Action Buttons + modal de Missa

```
Bloco C, Dia 1: Calendário — ajustes parecidos com o Bloco B (Painel).

1. Conectar os Action Buttons do Calendário com a página de criação
   correspondente (Missa/Evento), mesmo padrão do Bloco B.
2. Arrumar o mesmo modal de Missa (Visualizar/Update) usado aqui — se
   for o MESMO componente já corrigido no Bloco B, Dia 2, só confirmar
   que o Calendário está usando a versão corrigida (não duplicar
   correção). Se for um componente diferente, aplicar a mesma correção
   aqui.

Antes de começar, me confirme se o modal de Missa do Calendário é o
mesmo componente do Painel ou uma cópia separada.
```

**Teste manual:**
- Action Buttons do Calendário levam pra criação correta.
- Modal de Missa no Calendário funciona igual ao do Painel.

---

## BLOCO D — Header "Voltar" nas sub-telas (transversal)

**Pode rodar em paralelo aos Blocos B/C.**

### Dia 1 — Levantamento das sub-telas

```
Bloco D, Dia 1: adicionar "Voltar" (ícone < ou texto "Voltar") no
Header de toda tela de criação e de toda página dentro de /comunidade.

Antes de implementar, me ajude a levantar: liste todas as rotas que se
encaixam nessa regra (telas de criação de Missa/Evento/Escala/Álbum/
Comunicado + páginas dentro de /comunidade), a partir da estrutura de
pastas do projeto (vou colar a árvore de src/app).

[Colar aqui a árvore de pastas relevante]
```

### Dia 2 — Implementação

```
Dia 2 do Bloco D. Lista de rotas confirmada no Dia 1.

1. Criar um componente de Header reutilizável (ou adicionar prop
   opcional `onBack`/`backHref` no Header já existente, se ele for
   compartilhado) que renderiza o ícone/link de voltar quando aplicável.
2. Aplicar nas rotas levantadas no Dia 1.
3. Comportamento do "voltar": ir para a página anterior no histórico do
   navegador, ou para uma rota fixa conhecida (ex: sempre pra
   /comunidade a partir de uma sub-página dela) — perguntar antes de
   fixar, caso haja ambiguidade em alguma rota específica.

Gere o componente + a aplicação nas rotas.
```

**Teste manual:**
- Entrar em cada tela de criação e em cada sub-página de /comunidade → ícone/link de voltar aparece e funciona.

---

## BLOCO E — Comunidade (visão geral)

### Dia 1 — Action Buttons + mapeamento de navegação

```
Bloco E, Dia 1: página /comunidade (visão geral).

1. Antes de corrigir qualquer coisa, mapeie os botões de navegação
   atuais da página (o que cada um faz hoje vs. o que deveria fazer) —
   vou colar o componente da página.
2. Ajustar os Action Buttons pra levarem para a página de criação
   correta de cada entidade.
3. Reportar qualquer erro de navegação encontrado durante o mapeamento
   além dos já conhecidos, antes de corrigir tudo de uma vez.

[Colar aqui o componente da página /comunidade]
```

**Teste manual:**
- Cada Action Button de /comunidade navega para a página de criação correta.

---

## BLOCO F — Comunidade > Eventos

**Depende do Bloco A (Tabela Genérica).**

### Dia 1 — Migração para Tabela Genérica

```
Bloco F, Dia 1: migrar a tabela de /comunidade/eventos para usar o
<GenericTable /> do Bloco A.

1. Adaptar colunas/ações específicas de Eventos (nome, data, categoria,
   Pastorais vinculadas, ações: Editar, Remover, Ver confirmações de
   presença) para o formato de props do componente genérico.
2. Remover a tabela específica antiga.

Gere a página atualizada.
```

### Dia 2 — Último card (cancelamento) + Action Button

```
Dia 2 do Bloco F.

1. O último card da página de Eventos (hoje relacionado a
   cancelamento) vai mudar de comportamento — te aviso qual é o novo
   comportamento agora, na hora, antes de você implementar.
   [OBSERVAÇÃO: não assumir nada sobre esse card até eu descrever o
   comportamento esperado neste dia.]
2. Ajustar o Action Button da página pra levar pra página de criação de
   Evento.

[Descrever aqui o novo comportamento do card de cancelamento antes de implementar]
```

**Teste manual:**
- Tabela de Eventos renderiza com o componente genérico, mesmas colunas/ações de antes.
- Card de cancelamento com o novo comportamento (validar conforme definido no Dia 2).
- Action Button leva pra criação de Evento.

---

## BLOCO G — Comunidade > Comunicados

**Depende do Bloco A (Tabela Genérica).**

### Dia 1 — Migração para Tabela Genérica + Action Button

```
Bloco G, Dia 1: /comunidade/comunicados.

1. Migrar a tabela atual de Comunicados para o <GenericTable /> do
   Bloco A, mantendo filtros/paginação/busca já existentes.
2. Conectar o Action Button da página com a página de criação correta
   de Comunicado (hoje parece estar indo pro lugar errado — vou colar o
   componente atual pra você confirmar o destino certo).

[Colar aqui o componente atual de /comunidade/comunicados]
```

**Teste manual:**
- Tabela de Comunicados com o componente genérico, filtros funcionando.
- Action Button leva pra criação correta.

---

## BLOCO H — Comunidade > Álbuns

**Depende do Bloco A (Tabela Genérica).**

### Dia 1 — Migração para Tabela Genérica

```
Bloco H, Dia 1: /comunidade/galeria (Álbuns).

Migrar a tabela/listagem atual de Álbuns para o <GenericTable /> do
Bloco A (título, evento vinculado, quantidade de fotos, ações: Editar,
Ver fotos, Remover).

Gere a página atualizada.
```

### Dia 2 — Último card (comportamento a decidir)

```
Dia 2 do Bloco H.

O último card da página de Álbuns vai mudar de comportamento — te aviso
qual é o novo comportamento agora, na hora, antes de você implementar.
[OBSERVAÇÃO: não assumir nada sobre esse card até eu descrever o
comportamento esperado neste dia.]

[Descrever aqui o novo comportamento antes de implementar]
```

### Dia 3 — Bug ao criar Álbum

```
Dia 3 do Bloco H: corrigir erro ao criar Álbum na tela de criação.

[OBSERVAÇÃO: este dia depende de eu colar o print/mensagem de erro e o
componente da tela de criação — ainda não enviei. Não gerar hipótese de
correção antes disso.]

Vou colar agora o erro e o componente:
[Colar aqui o erro/print + o componente da tela de criação de Álbum]
```

**Teste manual:**
- Listagem de Álbuns com componente genérico.
- Card com novo comportamento (conforme Dia 2).
- Criar Álbum do zero sem erro.

---

## BLOCO I — Escalas

### Dia 1 — Último card (comportamento a decidir) + Action Button

```
Bloco I, Dia 1: página de Escalas.

1. O último card da página de Escalas vai mudar de comportamento — te
   aviso qual é o novo comportamento agora, na hora, antes de você
   implementar.
   [OBSERVAÇÃO: não assumir nada sobre esse card até eu descrever o
   comportamento esperado neste dia.]
2. Ajustar o Action Button da página pra levar pra página de criação de
   Escala.

[Descrever aqui o novo comportamento do card antes de implementar]
```

**Teste manual:**
- Card de Escalas com novo comportamento validado.
- Action Button leva pra criação de Escala.

---

# PARTE 2 — Revisão de Qualidade por Módulo

Cada bloco abaixo cobre um módulo do sistema, sempre nos mesmos 5 eixos:
consistência com RN, duplicação/reuso, código morto, erro/loading,
roteiro de teste manual (UCs + 3 cargos quando aplicável).

## BLOCO J — Missas

```
Bloco J do roadmap de revisão de qualidade: módulo Missas.

Vou colar o(s) arquivo(s) relevante(s) (controller, service, DTOs,
componentes de front envolvidos: modal, formulário, listagem). Analise:

1. Consistência com RN002 (Missa/Evento entidades separadas) e com o
   fluxo de Missas Recorrentes (Bloco 5 do roadmap anterior) — confirmar
   que generatedFromTemplateId não interfere na edição normal.
2. Duplicação de código / oportunidade de reuso dos inputs
   componentizados (TextInput, SelectInput, ComboboxInput, etc.) e do
   <GenericTable /> (se este bloco rodar depois do Bloco A da Parte 1).
3. Código morto, comentários desatualizados, TODOs esquecidos,
   gambiarras que só faziam sentido antes do roadmap consolidado (ex:
   fallback sem Pastoral vinculada, mencionado no Bloco 1/Dia 3 daquele
   roadmap — confirmar se ainda é necessário).
4. Tratamento de erro e estados de loading no formulário/listagem.
5. Gerar um roteiro de teste manual cobrindo UC011-014, testado como
   Admin Geral, Secretaria e Coordenador de Pastoral (este último deve
   ser bloqueado, conforme RN004/RN005).

Não altere nada ainda — primeiro me traga um relatório dos achados,
organizado pelos 5 eixos acima, e eu decido o que priorizar.

[Colar aqui os arquivos do módulo Missas]
```

## BLOCO K — Eventos

```
Bloco K do roadmap de revisão de qualidade: módulo Eventos.

Mesmo formato do Bloco J, adaptado a Eventos. Pontos específicos a
verificar:
1. RN002 (correlação opcional e não-exclusiva com Missa) e RN003/RN017
   proposta (Pastorais vinculadas via evento_pastorais).
2. Duplicação com Missas (campos parecidos: data, local) — vale
   compartilhar algum sub-componente de formulário?
3. Código morto relacionado à categoria como texto livre (já migrada
   pra categoria_id, conforme comentário no schema.prisma) — conferir
   se sobrou algum resquício no front.
4. Erro/loading no formulário e na tabela (já migrada pro
   <GenericTable /> no Bloco F, se rodado antes).
5. Roteiro de teste manual: UC015-019, 3 cargos.

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Eventos]
```

## BLOCO L — Escalas

```
Bloco L do roadmap de revisão de qualidade: módulo Escalas.

Pontos específicos:
1. RN007 (Missa XOR Evento, validado em SERVICE) — conferir se a
   validação está realmente robusta no service, já que não há mais
   CHECK de banco.
2. RN006/RN008 (escopo por Pastoral do Coordenador) e RN017 proposta
   (escalas.pastoral_id ⊆ pastorais vinculadas à Missa/Evento) — este
   último está marcado como pendência de SERVICE no roadmap anterior
   (Bloco 4). Confirmar se já foi implementado ou segue pendente.
3. Duplicação entre RegisterScheduleModal e a futura página
   /escalas/criar (Bloco 9 do roadmap anterior, se já implementado).
4. Erro/loading, especialmente no select de Voluntário filtrado por
   Pastoral (Bloco 1, Dia 3 do roadmap anterior).
5. Roteiro de teste manual: UC020-023, 3 cargos, incluindo o caso de
   bloqueio de duplicidade (mesmo Voluntário/função na mesma Escala).

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Escalas]
```

## BLOCO M — Voluntários

```
Bloco M do roadmap de revisão de qualidade: módulo Voluntários.

Pontos específicos:
1. RN009 (não é usuário) e o vínculo 1:N com Pastoral (Bloco 1 do
   roadmap anterior) — conferir se o bloqueio 403 pra Coordenador
   cadastrando fora da própria Pastoral está coberto por teste/está
   correto no código atual.
2. Duplicação de formulário com outras entidades que têm select de
   Pastoral (Usuários, Escalas).
3. Código morto: qualquer resquício do período em que Voluntário não
   tinha pastoralGroupId obrigatório.
4. Erro/loading no cadastro e na listagem.
5. Roteiro de teste manual: UC008-010, 3 cargos.

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Voluntários]
```

## BLOCO N — Comunicados

```
Bloco N do roadmap de revisão de qualidade: módulo Comunicados.

Pontos específicos:
1. RF013 e o card "Avisos pendentes" (Bloco 8, Dia 2 do roadmap
   anterior — pendente = status DRAFT) — confirmar se a equivalência
   está implementada e correta.
2. Duplicação com a tabela migrada no Bloco G (Parte 1 deste roadmap).
3. Código morto: categoria como texto livre (já migrada pra
   categoria_id) — mesmo ponto de atenção de Eventos.
4. Erro/loading no upload de imagem (RNF008 — validação de tipo/tamanho
   também no back, não só no front).
5. Roteiro de teste manual: UC024-026, Admin Geral e Secretaria (não
   aplicável a Coordenador de Pastoral).

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Comunicados]
```

## BLOCO O — Álbuns/Galeria

```
Bloco O do roadmap de revisão de qualidade: módulo Álbuns/Galeria.

Pontos específicos:
1. RN003 (álbum avulso ou vinculado a Evento) e RN010 (1 Foto = 1
   Álbum, capa única validada em SERVICE, não mais em constraint de
   banco) — conferir se a validação de capa única no service está
   sólida.
2. Duplicação com a tabela migrada no Bloco H (Parte 1).
3. Código morto: qualquer resquício da antiga constraint de capa única
   removida do schema (comentário no schema_modelagem_mysql.sql).
4. Erro/loading no upload de fotos (múltiplos arquivos, rejeição parcial
   por tipo/tamanho conforme UC028).
5. Roteiro de teste manual: UC027-030, Admin Geral e Secretaria.

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Álbuns/Galeria]
```

## BLOCO P — Pastorais

```
Bloco P do roadmap de revisão de qualidade: módulo Pastorais.

Pontos específicos:
1. RN006 (Coordenador vinculado a exatamente 1 Pastoral) e o novo campo
   defaultRole (Bloco 1 do roadmap anterior) — conferir se está sendo
   usado corretamente no fluxo de Escala.
2. Duplicação de CRUD simples com outras entidades de conteúdo
   (Sacramentos).
3. Código morto.
4. Erro/loading.
5. Roteiro de teste manual: UC033-034, Admin Geral (irrestrito) e
   Coordenador de Pastoral (restrito à própria pastoral, sem criar
   nova).

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Pastorais]
```

## BLOCO Q — Usuários e Cargos

```
Bloco Q do roadmap de revisão de qualidade: módulo Usuários/Cargos.

Pontos específicos:
1. RN004/RN005 (1 Cargo por usuário, permissões por Cargo) e a regra de
   não permitir inativar o único Admin Geral ativo (UC003, pendência
   levantada nos casos de uso — confirmar se essa trava foi
   efetivamente implementada).
2. Duplicação de formulário de Usuário com o de Voluntário (campos de
   Pastoral em comum).
3. Código morto.
4. Erro/loading, especialmente na criação (e-mail único, política
   mínima de senha).
5. Roteiro de teste manual: UC001-007, focando em Admin Geral (único
   ator com acesso a este módulo, conforme RN004).

Relatório primeiro, sem alterar nada.

[Colar aqui os arquivos do módulo Usuários/Cargos]
```

---

## Resumo da ordem (dependências)

```
PARTE 1 — Páginas
Bloco A (Tabela Genérica) ──> Bloco F, Bloco G, Bloco H
Bloco D (Header Voltar) ──independente, pode rodar em paralelo a B/C/E
Bloco B (Painel) ──independente
Bloco C (Calendário) ──depende do mesmo modal de Missa do Bloco B (confirmar se é compartilhado)
Bloco E (Comunidade visão geral) ──independente, mas natural antes de F/G/H
Bloco I (Escalas) ──independente

PARTE 2 — Revisão de qualidade (podem rodar em qualquer ordem, mas
sugerido depois da Parte 1 nos módulos que tiveram página migrada,
pra revisar já o código pós-migração)
Bloco J (Missas)
Bloco K (Eventos) ── melhor depois do Bloco F
Bloco L (Escalas) ── melhor depois do Bloco I
Bloco M (Voluntários)
Bloco N (Comunicados) ── melhor depois do Bloco G
Bloco O (Álbuns/Galeria) ── melhor depois do Bloco H
Bloco P (Pastorais)
Bloco Q (Usuários/Cargos)
```

Sugestão de execução: começar pelo **Bloco A** (destrava F/G/H), rodar
B/C/D/E/I em paralelo conforme disponibilidade, e ir intercalando os
Blocos de revisão de qualidade (J-Q) conforme cada módulo for
estabilizando na Parte 1.
