Requisitos e Regras de Negócio - Sistema Paroquial

Este documento complementa o "Contexto do Projeto". Em caso de conflito, os detalhes técnicos definidos aqui (RF/RNF/RN) prevalecem, pois representam um refinamento do escopo geral.

1 - Requisitos Funcionais (RF)
ID	Requisito	Fase / Observações
RF001	O sistema deve manter Usuários.	MVP
RF002	O sistema deve permitir, por enquanto, apenas cadastro de admins.	MVP — paroquiano fica pra fase futura
RF003	O sistema deve permitir autenticação/login com 2FA.	Fase futura — MVP terá login simples, sem 2FA
RF004	O sistema deve manter Cargos (Roles).	MVP
RF005	O sistema deve permitir controle de permissões por Cargo.	MVP
RF006	O sistema deve permitir cadastro de Voluntários (não são usuários).	MVP
RF007	O sistema deve manter Escalas.	MVP
RF008	O sistema deve permitir relatórios de Escalas para Admins com cargo Secretaria, Admin Geral, e Coordenador da Pastoral da mesma escala.	MVP
RF009	O sistema deve manter Missas.	MVP
RF010	O sistema deve manter Eventos.	MVP
RF011	O sistema deve permitir correlação de Missas e Eventos.	MVP
RF012	O sistema deve permitir "Garantir Presença" em eventos: cadastro simples (nome + contato), sem login, salvo no banco vinculado ao evento.	MVP
RF013	O sistema deve manter Comunicados.	MVP
RF014	O sistema deve manter Álbuns (Galeria).	MVP
RF015	O sistema deve permitir correlação entre Álbum e Evento.	MVP
RF016	O sistema deve manter Fotos.	MVP
RF017	O sistema deve permitir que Álbuns tenham várias Fotos (1:N).	MVP
RF018	O sistema deve manter Sacramentos.	MVP
RF019	O sistema deve manter Pastorais.	MVP
RF020	O sistema deve manter Doações.	Fase 2
RF021	O sistema deve manter Campanhas de Arrecadação.	Fase 2
RF022	O sistema deve permitir Doações vinculadas a Campanhas de Arrecadação.	Fase 2
RF023	O sistema deve manter Contatos e Sobre Nós fixos/hardcoded no front, sem gestão pelo admin.	MVP
RF024	O sistema deve permitir área de acesso para o fiel/paroquiano.	Fase 4
2 - Requisitos Não Funcionais (RNF)
ID	Requisito
RNF001	O site institucional deve ser responsivo, funcionando corretamente em desktop, tablet e mobile.
RNF002	O painel admin deve ter interface simples e intuitiva, utilizável por pessoas sem conhecimento técnico.
RNF003	O front-end deve ser desenvolvido em Next.js.
RNF004	O back-end deve expor uma API REST consumida pelo front-end, com dados persistidos em PostgreSQL (a confirmar definitivamente).
RNF005	As senhas dos usuários do admin devem ser armazenadas com hash forte (ex: bcrypt/argon2), nunca em texto puro.
RNF006	O sistema deve validar e sanitizar toda entrada de dados (formulários públicos, comunicados, uploads), prevenindo XSS/SQL Injection.
RNF007	O sistema deve tratar dados pessoais (voluntários, confirmações de presença) em conformidade com a LGPD — coleta mínima, finalidade explícita, possibilidade de exclusão.
RNF008	Uploads de imagens devem ter limite de tamanho e tipo validado no back-end, não só no front.
RNF009	O tempo de resposta das páginas públicas deve ser adequado para conexões móveis comuns, com otimização de imagens via next/image e paginação/lazy loading onde aplicável.
RNF010	O sistema deve manter backup periódico do banco de dados.
RNF011	O painel admin deve registrar log básico de ações críticas (quem criou/editou/removeu o quê), para auditoria simples.
RNF012	O sistema deve ter disponibilidade adequada para uso contínuo pela comunidade, sem downtime planejado em horários de pico.
RNF013	O código deve seguir padrão de organização e nomenclatura consistente entre front e back.
RNF014	As páginas públicas devem ter SEO básico: meta tags, sitemap, Open Graph (para preview ao compartilhar no WhatsApp/redes sociais).
RNF015	O site institucional deve seguir boas práticas de acessibilidade (a11y): contraste adequado, navegação por teclado, alt text em imagens.
RNF016	Páginas públicas de conteúdo pouco variável (Sacramentos, Pastorais, Sobre Nós) devem usar cache/ISR para reduzir carga no back-end.
RNF017	Endpoints públicos de escrita sem autenticação (Garantir Presença, formulário de contato) devem ter rate limiting contra spam/abuso.
RNF018	Credenciais e segredos devem ser geridos via variáveis de ambiente, nunca commitados no repositório.
RNF019	O sistema deve ter testes automatizados mínimos cobrindo regras de negócio críticas (ex: exclusividade Missa/Evento em Escala, permissões por cargo).
RNF020	O schema do banco de dados deve ser versionado via migrations (ex: Prisma Migrate, TypeORM migrations ou equivalente).
3 - Regras de Negócio (RN)
ID	Regra
RN001	Não há cadastro público de membros/paroquianos nesta versão do sistema — apenas usuários internos (admin) são cadastrados via login. O "Garantir Presença" (RF012) é exceção pontual: cadastro leve, sem login, restrito ao contexto de um evento.
RN002	Missa e Evento são entidades separadas e independentes. Um Evento pode, opcionalmente, se correlacionar a uma Missa (ex: uma missa especial que também é tratada como evento), mas nunca são a mesma tabela/registro.
RN003	Álbuns de fotos podem existir vinculados a um Evento ou de forma avulsa (sem evento associado).
RN004	Cada usuário do admin possui exatamente um Cargo, e o Cargo determina as áreas do sistema que ele pode acessar/gerenciar.
RN005	Cargos disponíveis inicialmente: Admin Geral (acesso total ao sistema), Secretaria (gestão de comunicados, eventos, missas, calendário, sacramentos e galeria — sem gestão de usuários nem escalas) e Coordenador de Pastoral (gestão restrita ao conteúdo e às escalas da pastoral à qual está vinculado). Novos cargos podem ser criados via CRUD (RF004), mas suas permissões específicas exigem definição adicional caso não se encaixem nesse padrão.
RN006	Um usuário com cargo Coordenador de Pastoral está vinculado a exatamente uma Pastoral (relação 1:N — uma pastoral pode ter vários coordenadores, mas cada coordenador coordena apenas uma pastoral). Ele só pode visualizar/gerenciar a Pastoral e as Escalas vinculadas a ela.
RN007	Uma Escala deve estar vinculada a uma Missa ou a um Evento — nunca a ambos simultaneamente, nem a nenhum dos dois.
RN008	Relatórios de Escala (RF008) só podem ser acessados por: Admin Geral (todas as escalas), Secretaria (todas as escalas) e Coordenador de Pastoral (apenas escalas vinculadas à sua própria pastoral).
RN009	Voluntários não são usuários do sistema — não possuem login nem acesso ao admin. São apenas cadastros de apoio para atribuição em Escalas.
RN010	Um Álbum pode conter várias Fotos (1:N). Uma Foto pertence a exatamente um Álbum.
RN011	As páginas "Sobre Nós" e "Contatos" do site institucional não são gerenciáveis pelo admin — conteúdo fixo/hardcoded no front-end.
RN012	A confirmação de presença em evento ("Garantir Presença") não garante lugar reservado nesta versão — é apenas um registro informativo. Reserva efetiva de lugares é possibilidade futura, condicionada a decisão do padre responsável.
RN013	Doações e Campanhas de Arrecadação (RF020-022) não fazem parte do escopo do MVP atual — ficam reservadas para a Fase 2 do projeto.
RN014	A área de acesso para o fiel/paroquiano (RF024), incluindo qualquer cadastro público de conta, autenticação de paroquiano ou funcionalidades dependentes disso, não faz parte do escopo atual — fica reservada para a Fase 4 (última fase) do projeto.
RN015	Autenticação com 2FA (RF003) não faz parte do MVP atual — o login inicial dos usuários do admin será simples (usuário/senha), com 2FA reservado para fase futura.