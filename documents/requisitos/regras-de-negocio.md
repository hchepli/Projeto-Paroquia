# 📐 Regras de Negócio (RN)

> Restrições e políticas que o sistema deve respeitar, independentemente da interface.

## 👥 Usuários, Cargos e Permissões

| ID | Regra |
|---|---|
| RN001 | Não há cadastro público de paroquianos nesta versão. Apenas usuários internos (admin). "Garantir Presença" (RF012) é exceção pontual: cadastro leve, sem login, restrito a um evento. |
| RN004 | Cada usuário do admin possui **exatamente um Cargo**, que determina as áreas que pode acessar/gerenciar. |
| RN005 | Cargos iniciais: **Admin Geral** (acesso total), **Secretaria** (comunicados, eventos, missas, calendário, sacramentos e galeria; sem gestão de usuários) e **Coordenador de Pastoral** (conteúdo e escalas da própria pastoral). Novos cargos via CRUD exigem definição adicional de permissões. |
| RN006 | Coordenador de Pastoral está vinculado a **exatamente uma Pastoral** (uma pastoral pode ter vários coordenadores). Só visualiza/gerencia sua Pastoral e suas Escalas. |
| RN009 | Voluntários **não são usuários**: sem login, apenas cadastros de apoio para Escalas. |

## 🗓️ Missas, Eventos e Escalas

| ID | Regra |
|---|---|
| RN002 | Missa e Evento são entidades **separadas**. Um Evento pode, opcionalmente, correlacionar-se a uma Missa, mas nunca são o mesmo registro. |
| RN007 | Uma Escala deve estar vinculada a uma Missa **ou** a um Evento: nunca a ambos, nunca a nenhum. *(validada no SERVICE, sem CHECK no banco)* |
| RN008 | Relatórios de Escala: Admin Geral e Secretaria veem todas; Coordenador de Pastoral, apenas as da própria pastoral. |
| RN012 | "Garantir Presença" é **apenas informativo**, não reserva lugar. Reserva efetiva é possibilidade futura (decisão do padre responsável). |
| RN016 | Ao excluir Missa/Evento com Escala(s) vinculada(s), o sistema exibe aviso explícito e exige **confirmação extra**; se confirmado, as Escalas são removidas em cascata. |

## 🖼️ Galeria e Conteúdo

| ID | Regra |
|---|---|
| RN003 | Álbuns podem estar vinculados a um Evento ou ser avulsos. |
| RN010 | Um Álbum contém várias Fotos (1:N); cada Foto pertence a exatamente um Álbum. Capa única por álbum, *validada no SERVICE*. |
| RN011 | "Sobre Nós" e "Contatos" são conteúdo fixo no front-end, sem gestão pelo admin. |

## 🧭 Escopo e Fases

| ID | Regra |
|---|---|
| RN013 | Doações e Campanhas de Arrecadação ficam para a **Fase 2**. |
| RN014 | Área do fiel/paroquiano (cadastro público, autenticação de paroquiano) fica para a **Fase 4**. |
| RN015 | 2FA não faz parte do MVP: login inicial simples (e-mail/senha). |

## 🧪 Regras propostas (aguardando confirmação)

| ID | Regra | Status |
|---|---|---|
| RN017 | Missa/Evento pode ter várias Pastorais vinculadas (N:N via `missa_pastorais` / `evento_pastorais`). O Coordenador só cria Escala se sua Pastoral estiver entre as vinculadas. | ⏳ Proposta, ainda fora do `schema.prisma` real |
