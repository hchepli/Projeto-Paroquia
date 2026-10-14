# Casos de Uso — Sistema Paroquial
 
Este documento detalha os Casos de Uso (UC) do sistema, organizados por módulo/entidade, com base nos Requisitos Funcionais (RF), Não Funcionais (RNF) e Regras de Negócio (RN) já consolidados.
 
**Atores considerados:**
- **Admin Geral** — acesso total ao sistema.
- **Secretaria** — gestão de comunicados, eventos, missas, calendário, sacramentos e galeria.
- **Coordenador de Pastoral** — gestão restrita ao conteúdo e escalas da própria pastoral.
- **Visitante** — público em geral, sem login, acessando o site institucional.
> Nova regra de negócio identificada durante esta etapa (a incorporar no documento de RN):
> **RN016** — Ao excluir uma Missa ou Evento que possua Escala(s) vinculada(s), o sistema deve exibir aviso explícito informando a existência de escalas dependentes, exigindo confirmação extra do admin antes de prosseguir. Se confirmado, a exclusão remove a(s) Escala(s) em cascata.
 
---
 
## Módulo: Usuários e Cargos
 
### UC001 — Cadastrar Usuário do Admin
- **Ator(es):** Admin Geral
- **Pré-condições:** Usuário autenticado com cargo Admin Geral.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Usuários.
  2. Ator seleciona "Novo Usuário".
  3. Sistema exibe formulário (nome, e-mail, senha, cargo).
  4. Ator preenche os dados e confirma.
  5. Sistema valida (e-mail único, senha com política mínima) e cria o usuário com senha em hash (RNF005).
  6. Sistema exibe confirmação de sucesso.
- **Fluxos alternativos/exceção:**
  - 5a. E-mail já cadastrado → sistema exibe erro.
  - 5b. Dados obrigatórios ausentes/inválidos → sistema exibe erro, mantém formulário preenchido.
  - Ator sem permissão (Secretaria ou Coordenador de Pastoral) → sistema bloqueia acesso à tela (RN004).
### UC002 — Editar Usuário do Admin
- **Ator(es):** Admin Geral
- **Pré-condições:** Usuário já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Usuário na listagem.
  2. Ator seleciona "Editar".
  3. Sistema exibe formulário preenchido (exceto senha, que só é alterada via ação específica).
  4. Ator altera os campos desejados e confirma.
  5. Sistema valida e atualiza o registro.
- **Fluxos alternativos/exceção:**
  - 5a. Dados inválidos → sistema exibe erro, não salva.
### UC003 — Inativar/Reativar Usuário do Admin
- **Ator(es):** Admin Geral
- **Pré-condições:** Usuário já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Usuário na listagem.
  2. Ator seleciona "Inativar" (ou "Reativar").
  3. Sistema solicita confirmação.
  4. Ator confirma.
  5. Sistema atualiza o status do usuário; usuário inativo não consegue mais autenticar.
- **Fluxos alternativos/exceção:**
  - Ator tenta inativar a si mesmo sendo o único Admin Geral ativo → sistema bloqueia a ação (garantir ao menos um Admin Geral ativo).
### UC004 — Listar/Visualizar Usuários
- **Ator(es):** Admin Geral
- **Pré-condições:** Usuário autenticado com cargo Admin Geral.
- **Fluxo principal:**
  1. Ator acessa a listagem de Usuários.
  2. Sistema exibe usuários cadastrados, com filtro por cargo/status.
### UC005 — Cadastrar Cargo (Role)
- **Ator(es):** Admin Geral
- **Pré-condições:** Usuário autenticado com cargo Admin Geral.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Cargos.
  2. Ator seleciona "Novo Cargo".
  3. Sistema exibe formulário (nome, descrição).
  4. Ator preenche e confirma.
  5. Sistema valida (nome único) e cria o Cargo.
- **Fluxos alternativos/exceção:**
  - 5a. Nome de cargo já existente → sistema exibe erro.
  - Cargo criado fora do padrão dos três iniciais (Admin Geral, Secretaria, Coordenador de Pastoral) exige definição adicional de permissões (RN005) → sistema alerta que as permissões desse novo cargo precisarão ser configuradas manualmente.
### UC006 — Editar/Remover Cargo
- **Ator(es):** Admin Geral
- **Pré-condições:** Cargo já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Cargo na listagem.
  2. Ator seleciona "Editar" ou "Remover".
  3. Sistema aplica a alteração ou solicita confirmação de remoção.
- **Fluxos alternativos/exceção:**
  - Tentativa de remover um Cargo que possui Usuários vinculados → sistema bloqueia a remoção até que os usuários sejam reatribuídos a outro cargo.
  - Tentativa de remover um dos três cargos base (Admin Geral, Secretaria, Coordenador de Pastoral) → sistema alerta sobre o impacto e exige confirmação extra.
### UC007 — Autenticar (Login)
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral
- **Pré-condições:** Usuário cadastrado e ativo.
- **Fluxo principal:**
  1. Ator acessa a tela de login do admin.
  2. Ator informa e-mail e senha.
  3. Sistema valida as credenciais.
  4. Sistema autentica o ator e redireciona ao painel, exibindo apenas as áreas permitidas para seu cargo (RN004).
- **Fluxos alternativos/exceção:**
  - 3a. Credenciais inválidas → sistema exibe erro genérico (sem indicar se é e-mail ou senha incorretos, por segurança).
  - 3b. Usuário inativo → sistema bloqueia o acesso com mensagem específica.
  - *(Fase futura)* Login com 2FA (RF003) — fora do MVP atual.
---
 
## Módulo: Voluntários
 
### UC008 — Cadastrar Voluntário
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Voluntários.
  2. Ator seleciona "Novo Voluntário".
  3. Sistema exibe formulário (nome, telefone, e-mail).
  4. Ator preenche e confirma.
  5. Sistema valida e persiste o Voluntário (RN009 — Voluntário não é usuário, não possui login).
- **Fluxos alternativos/exceção:**
  - 5a. Dados obrigatórios ausentes → sistema exibe erro.
### UC009 — Editar/Remover Voluntário
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Voluntário já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Voluntário na listagem.
  2. Ator seleciona "Editar" ou "Remover".
  3. Sistema aplica a alteração ou solicita confirmação de remoção.
- **Fluxos alternativos/exceção:**
  - Voluntário possui atribuições em Escalas futuras → sistema alerta o ator antes de remover, listando as escalas afetadas.
### UC010 — Listar/Visualizar Voluntários
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral
- **Pré-condições:** Usuário autenticado.
- **Fluxo principal:**
  1. Ator acessa a listagem de Voluntários.
  2. Sistema exibe voluntários cadastrados (Coordenador de Pastoral vê apenas os vinculados a escalas de sua pastoral, se aplicável).
---
 
## Módulo: Missas
 
### UC011 — Cadastrar Missa
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Usuário autenticado com cargo Admin Geral ou Secretaria.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Missas no admin.
  2. Ator seleciona "Nova Missa".
  3. Sistema exibe formulário (título, data/hora, tipo comum/especial, local, observações).
  4. Ator preenche os dados e confirma.
  5. Sistema valida os dados e persiste a nova Missa.
  6. Sistema exibe confirmação de sucesso e a Missa passa a ser refletida no Calendário público (RF011).
- **Fluxos alternativos/exceção:**
  - 5a. Dados obrigatórios ausentes/inválidos → sistema exibe mensagem de erro e mantém formulário preenchido.
  - Ator sem permissão (ex: Coordenador de Pastoral) → sistema bloqueia acesso à tela (RN004/RN005).
### UC012 — Editar Missa
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Missa já cadastrada; usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator localiza a Missa na listagem.
  2. Ator seleciona "Editar".
  3. Sistema exibe formulário preenchido com dados atuais.
  4. Ator altera os campos desejados e confirma.
  5. Sistema valida e atualiza o registro.
  6. Calendário público reflete a alteração automaticamente.
- **Fluxos alternativos/exceção:**
  - 5a. Dados inválidos → sistema exibe erro, não salva.
### UC013 — Remover Missa
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Missa já cadastrada.
- **Fluxo principal:**
  1. Ator localiza a Missa na listagem.
  2. Ator seleciona "Remover".
  3. Sistema solicita confirmação.
  4. Ator confirma.
  5. Sistema remove o registro e reflete a ausência no Calendário público.
- **Fluxos alternativos/exceção:**
  - 4a. Missa possui Escala vinculada → sistema exibe aviso com o detalhe das escalas afetadas e exige confirmação extra antes de excluir (RN016). Se confirmado, exclui Missa e Escalas vinculadas em cascata.
### UC014 — Listar/Visualizar Missas
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (leitura), Visitante (público, via Calendário)
- **Pré-condições:** Nenhuma para o público; autenticação para o admin.
- **Fluxo principal:**
  1. Ator acessa a listagem de Missas (admin) ou o Calendário (público).
  2. Sistema exibe Missas cadastradas, com filtro por período, se aplicável.
---
 
## Módulo: Eventos
 
### UC015 — Cadastrar Evento
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Eventos.
  2. Ator seleciona "Novo Evento".
  3. Sistema exibe formulário (nome, slug, descrição, categoria, data início/fim, local, e opcionalmente vínculo com Missa).
  4. Ator preenche os dados e confirma.
  5. Sistema valida (slug único) e persiste o Evento.
  6. Evento passa a ser refletido no Calendário público e na listagem de Eventos (futuro/passado, conforme a data).
- **Fluxos alternativos/exceção:**
  - 5a. Slug já existente → sistema sugere um slug alternativo ou solicita ajuste.
  - 5b. Dados obrigatórios ausentes/inválidos → sistema exibe erro.
### UC016 — Editar Evento
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Evento já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Evento na listagem.
  2. Ator seleciona "Editar".
  3. Sistema exibe formulário preenchido.
  4. Ator altera os campos desejados e confirma.
  5. Sistema valida e atualiza o registro.
- **Fluxos alternativos/exceção:**
  - 5a. Dados inválidos → sistema exibe erro, não salva.
### UC017 — Remover Evento
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Evento já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Evento na listagem.
  2. Ator seleciona "Remover".
  3. Sistema solicita confirmação.
  4. Ator confirma.
  5. Sistema remove o registro (e o vínculo com Álbum, se houver, passa a órfão ou é tratado conforme regra de galeria).
- **Fluxos alternativos/exceção:**
  - 4a. Evento possui Escala vinculada → sistema exibe aviso e exige confirmação extra antes de excluir (RN016), removendo a(s) Escala(s) em cascata se confirmado.
  - 4b. Evento possui Álbum vinculado → sistema alerta que o Álbum ficará sem vínculo com Evento (RN003 permite álbum avulso), sem impedir a exclusão do Evento.
### UC018 — Correlacionar Evento a uma Missa
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Evento e Missa já cadastrados.
- **Fluxo principal:**
  1. Ator edita o Evento (UC016).
  2. Ator seleciona uma Missa existente no campo de vínculo opcional.
  3. Sistema valida e salva a correlação (RN002 — permanecem entidades distintas).
- **Fluxos alternativos/exceção:**
  - Ator remove o vínculo → sistema apenas desfaz a correlação, sem afetar Missa ou Evento individualmente.
### UC019 — Listar/Visualizar Eventos
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (leitura), Visitante (público)
- **Pré-condições:** Nenhuma para o público; autenticação para o admin.
- **Fluxo principal:**
  1. Ator acessa a listagem de Eventos (admin) ou a página pública de Eventos.
  2. Sistema exibe Eventos passados e futuros, com página de detalhe individual (data, descrição, local, galeria vinculada, se houver).
---
 
## Módulo: Escalas
 
### UC020 — Cadastrar Escala
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Usuário autenticado; Missa ou Evento já cadastrado; Voluntários já cadastrados.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Escalas.
  2. Ator seleciona "Nova Escala".
  3. Sistema solicita vínculo com **Missa ou Evento** (exclusivo, nunca ambos — RN007).
  4. Ator seleciona o vínculo e adiciona atribuições (Voluntário + função: leitor, ministro da eucaristia, coroinha, etc.).
  5. Ator confirma.
  6. Sistema valida (vínculo obrigatório e exclusivo) e persiste a Escala com suas atribuições.
- **Fluxos alternativos/exceção:**
  - 6a. Ator tenta vincular Escala a Missa **e** Evento simultaneamente → sistema bloqueia com mensagem de erro (RN007).
  - 6b. Ator tenta criar Escala sem nenhum vínculo → sistema bloqueia (RN007).
  - Coordenador de Pastoral tenta criar Escala vinculada a Missa/Evento fora do escopo de sua pastoral → sistema bloqueia acesso (RN006).
### UC021 — Editar Escala (atribuições)
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Escala já cadastrada.
- **Fluxo principal:**
  1. Ator localiza a Escala na listagem.
  2. Ator adiciona, remove ou altera atribuições de Voluntários.
  3. Sistema valida e atualiza o registro.
- **Fluxos alternativos/exceção:**
  - Ator tenta atribuir o mesmo Voluntário duas vezes na mesma função da mesma Escala → sistema bloqueia duplicidade.
### UC022 — Remover Escala
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Escala já cadastrada.
- **Fluxo principal:**
  1. Ator localiza a Escala na listagem.
  2. Ator seleciona "Remover".
  3. Sistema solicita confirmação.
  4. Ator confirma.
  5. Sistema remove a Escala e suas atribuições.
### UC023 — Gerar Relatório de Escalas
- **Ator(es):** Admin Geral, Secretaria, Coordenador de Pastoral (restrito à própria pastoral)
- **Pré-condições:** Usuário autenticado (RF008/RN008).
- **Fluxo principal:**
  1. Ator acessa a área de Relatórios de Escala.
  2. Sistema filtra automaticamente conforme o cargo do ator (Admin Geral e Secretaria veem todas; Coordenador de Pastoral vê apenas as da própria pastoral).
  3. Ator aplica filtros adicionais (período, Missa/Evento, Voluntário).
  4. Sistema exibe/exporta o relatório.
- **Fluxos alternativos/exceção:**
  - Coordenador de Pastoral tenta acessar relatório de escala fora de sua pastoral → sistema bloqueia (RN008).
---
 
## Módulo: Comunicados
 
### UC024 — Cadastrar Comunicado
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Comunicados.
  2. Ator seleciona "Novo Comunicado".
  3. Sistema exibe formulário (título, conteúdo, categoria, imagem).
  4. Ator preenche, faz upload da imagem (se houver) e confirma.
  5. Sistema valida (tipo/tamanho de imagem — RNF008), registra o autor (usuário logado) e persiste o Comunicado.
  6. Comunicado passa a ser exibido na página pública de Comunicados.
- **Fluxos alternativos/exceção:**
  - 5a. Imagem fora do padrão (tamanho/tipo) → sistema exibe erro.
  - 5b. Dados obrigatórios ausentes → sistema exibe erro.
### UC025 — Editar/Remover Comunicado
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Comunicado já cadastrado.
- **Fluxo principal:**
  1. Ator localiza o Comunicado na listagem.
  2. Ator seleciona "Editar" ou "Remover".
  3. Sistema aplica a alteração ou solicita confirmação de remoção.
### UC026 — Listar/Visualizar Comunicados
- **Ator(es):** Admin Geral, Secretaria (admin), Visitante (público)
- **Pré-condições:** Nenhuma para o público.
- **Fluxo principal:**
  1. Ator acessa a listagem de Comunicados (admin) ou a página pública.
  2. Sistema exibe Comunicados ordenados por data, com paginação (RNF009).
---
 
## Módulo: Galeria (Álbuns e Fotos)
 
### UC027 — Cadastrar Álbum
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Galeria.
  2. Ator seleciona "Novo Álbum".
  3. Sistema exibe formulário (título, descrição, capa e, opcionalmente, vínculo com um Evento).
  4. Ator preenche e confirma.
  5. Sistema valida e persiste o Álbum, com ou sem vínculo a Evento (RN003).
### UC028 — Adicionar Fotos ao Álbum
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Álbum já cadastrado.
- **Fluxo principal:**
  1. Ator acessa o Álbum.
  2. Ator faz upload de uma ou mais fotos.
  3. Sistema valida tipo/tamanho (RNF008) e persiste as Fotos vinculadas ao Álbum (RN010 — 1 Foto pertence a exatamente 1 Álbum).
  4. Ator pode marcar uma foto como capa do Álbum.
- **Fluxos alternativos/exceção:**
  - 3a. Arquivo fora do padrão → sistema rejeita o(s) arquivo(s) inválido(s) e informa o motivo, mantendo os válidos.
### UC029 — Editar/Remover Álbum ou Foto
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Álbum/Foto já cadastrados.
- **Fluxo principal:**
  1. Ator localiza o Álbum ou Foto.
  2. Ator seleciona "Editar" ou "Remover".
  3. Sistema aplica a alteração ou solicita confirmação de remoção.
- **Fluxos alternativos/exceção:**
  - Remoção de Álbum remove todas as Fotos vinculadas em cascata (RN010) — sistema exige confirmação extra informando a quantidade de fotos afetadas.
### UC030 — Visualizar Galeria
- **Ator(es):** Visitante (público), Admin/Secretaria (gestão)
- **Pré-condições:** Nenhuma para o público.
- **Fluxo principal:**
  1. Ator acessa a página de Galeria.
  2. Sistema exibe Álbuns (vinculados a Evento ou avulsos), cada um com suas Fotos, com otimização via `next/image` (RNF009).
---
 
## Módulo: Sacramentos
 
### UC031 — Cadastrar/Editar/Remover Sacramento
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Sacramentos.
  2. Ator cria, edita ou remove um Sacramento (nome, descrição, documentos necessários, ordem de exibição, FAQ).
  3. Sistema valida e persiste a alteração.
  4. Alteração é refletida na página pública de Sacramentos, respeitando a ordem de exibição configurada.
- **Fluxos alternativos/exceção:**
  - Dados obrigatórios ausentes → sistema exibe erro.
### UC032 — Visualizar Sacramentos
- **Ator(es):** Visitante (público)
- **Pré-condições:** Nenhuma.
- **Fluxo principal:**
  1. Ator acessa a página de Sacramentos.
  2. Sistema exibe a listagem (ordenada por `displayOrder`) e permite acessar o detalhe de cada Sacramento (com FAQ e informações práticas).
---
 
## Módulo: Pastorais
 
### UC033 — Cadastrar/Editar/Remover Pastoral
- **Ator(es):** Admin Geral (irrestrito), Coordenador de Pastoral (restrito à própria pastoral, apenas edição de conteúdo)
- **Pré-condições:** Usuário autenticado com permissão adequada.
- **Fluxo principal:**
  1. Ator acessa a área de gestão de Pastorais.
  2. Ator cria, edita ou remove uma Pastoral (nome, descrição, contato).
  3. Sistema valida e persiste a alteração.
- **Fluxos alternativos/exceção:**
  - Coordenador de Pastoral tenta criar nova Pastoral ou editar outra que não a sua → sistema bloqueia (RN006).
  - Remoção de Pastoral com Coordenador(es) vinculado(s) → sistema alerta e exige reatribuição ou confirmação extra.
### UC034 — Visualizar Pastorais
- **Ator(es):** Visitante (público)
- **Pré-condições:** Nenhuma.
- **Fluxo principal:**
  1. Ator acessa a página de Pastorais.
  2. Sistema exibe a listagem e permite acessar o detalhe de cada Pastoral.
---
 
## Módulo: Garantir Presença
 
### UC035 — Confirmar Presença em Evento
- **Ator(es):** Visitante (público, sem login)
- **Pré-condições:** Evento cadastrado e disponível para confirmação de presença.
- **Fluxo principal:**
  1. Ator acessa a página de detalhe de um Evento.
  2. Ator seleciona "Garantir Presença".
  3. Sistema exibe formulário simples (nome + contato).
  4. Ator preenche e confirma.
  5. Sistema valida, aplica rate limiting (RNF017) e persiste o registro vinculado ao Evento (RN012 — não garante lugar reservado, apenas informativo).
  6. Sistema exibe confirmação de sucesso ao Visitante.
- **Fluxos alternativos/exceção:**
  - 5a. Dados obrigatórios ausentes/inválidos → sistema exibe erro.
  - 5b. Excesso de requisições do mesmo IP/contato em curto período → sistema bloqueia temporariamente (RNF017).
### UC036 — Consultar Confirmações de Presença de um Evento
- **Ator(es):** Admin Geral, Secretaria
- **Pré-condições:** Evento já cadastrado.
- **Fluxo principal:**
  1. Ator acessa o Evento no admin.
  2. Ator seleciona a aba/seção de confirmações de presença.
  3. Sistema exibe a lista de nomes e contatos registrados para aquele Evento.
---
 
## Módulo: Contatos e Sobre Nós
 
### UC037 — Visualizar Contatos / Sobre Nós
- **Ator(es):** Visitante (público)
- **Pré-condições:** Nenhuma.
- **Fluxo principal:**
  1. Ator acessa a página de Contatos ou Sobre Nós.
  2. Sistema exibe o conteúdo fixo/hardcoded no front-end (RF014/RN011 — sem gestão via admin).
- **Observação:** Não há caso de uso de edição para este módulo, pois o conteúdo não é gerenciável pelo admin no MVP atual.
---
 
## Pendências identificadas durante a elaboração dos Casos de Uso
 
1. **UC003** — regra para impedir que o último Admin Geral ativo seja inativado: confirmar se essa trava é realmente desejada.
2. **UC017/UC029** — comportamento de exclusão em cascata de Escalas e Fotos precisa ser validado tecnicamente (transação atômica) na fase de modelagem de dados.
3. **RN016** (nova) — ainda precisa ser formalmente incluída no documento de Regras de Negócio.
 