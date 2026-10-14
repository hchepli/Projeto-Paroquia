# 📋 Requisitos Funcionais (RF)

> Descrevem **o que o sistema deve fazer**.
> Em caso de conflito com o contexto geral do projeto, este documento prevalece.

**Legenda de fases:** 🟢 MVP · 🟡 Fase 2 · 🔵 Fase 4 · ⚪ Fase futura

## Usuários, Cargos e Autenticação

| ID | Requisito | Fase | Observações |
|---|---|:---:|---|
| RF001 | Manter Usuários | 🟢 | |
| RF002 | Cadastro apenas de admins por enquanto | 🟢 | Paroquiano fica para fase futura |
| RF003 | Autenticação/login com 2FA | ⚪ | MVP terá login simples, sem 2FA |
| RF004 | Manter Cargos (Roles) | 🟢 | |
| RF005 | Controle de permissões por Cargo | 🟢 | |

## Escalas e Voluntários

| ID | Requisito | Fase | Observações |
|---|---|:---:|---|
| RF006 | Cadastro de Voluntários (não são usuários) | 🟢 | |
| RF007 | Manter Escalas | 🟢 | |
| RF008 | Relatórios de Escalas para Admin Geral, Secretaria e Coordenador da Pastoral da mesma escala | 🟢 | |

## Missas e Eventos

| ID | Requisito | Fase | Observações |
|---|---|:---:|---|
| RF009 | Manter Missas | 🟢 | |
| RF010 | Manter Eventos | 🟢 | |
| RF011 | Correlação entre Missas e Eventos | 🟢 | |
| RF012 | "Garantir Presença" em eventos (nome + contato, sem login) | 🟢 | Salvo no banco, vinculado ao evento |

## Comunicação e Conteúdo

| ID | Requisito | Fase | Observações |
|---|---|:---:|---|
| RF013 | Manter Comunicados | 🟢 | |
| RF014 | Manter Álbuns (Galeria) | 🟢 | |
| RF015 | Correlação entre Álbum e Evento | 🟢 | |
| RF016 | Manter Fotos | 🟢 | |
| RF017 | Álbuns com várias Fotos (1:N) | 🟢 | |
| RF018 | Manter Sacramentos | 🟢 | |
| RF019 | Manter Pastorais | 🟢 | |
| RF023 | Contatos e Sobre Nós fixos (hardcoded no front) | 🟢 | Sem gestão pelo admin |

## Financeiro e Área do Fiel

| ID | Requisito | Fase | Observações |
|---|---|:---:|---|
| RF020 | Manter Doações | 🟡 | |
| RF021 | Manter Campanhas de Arrecadação | 🟡 | |
| RF022 | Doações vinculadas a Campanhas | 🟡 | |
| RF024 | Área de acesso para o fiel/paroquiano | 🔵 | |
