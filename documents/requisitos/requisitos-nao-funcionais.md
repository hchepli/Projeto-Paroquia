# ⚙️ Requisitos Não Funcionais (RNF)

> Descrevem **como o sistema deve se comportar** (qualidade, segurança, desempenho).

## 🎨 Usabilidade e Acessibilidade

| ID | Requisito |
|---|---|
| RNF001 | Site institucional responsivo (desktop, tablet e mobile). |
| RNF002 | Painel admin simples e intuitivo, utilizável por pessoas sem conhecimento técnico. |
| RNF015 | Boas práticas de acessibilidade (a11y): contraste, navegação por teclado, alt text em imagens. |

## 🧱 Arquitetura e Tecnologia

| ID | Requisito |
|---|---|
| RNF003 | Front-end desenvolvido em **Next.js**. |
| RNF004 | Back-end expõe **API REST** consumida pelo front, com dados em **PostgreSQL**. |
| RNF013 | Organização e nomenclatura de código consistentes entre front e back. |
| RNF020 | Schema do banco versionado via **migrations** (Prisma Migrate). |

## 🔒 Segurança e Privacidade

| ID | Requisito |
|---|---|
| RNF005 | Senhas armazenadas com hash forte (bcrypt/argon2), nunca em texto puro. |
| RNF006 | Validar e sanitizar toda entrada de dados (prevenção de XSS/SQL Injection). |
| RNF007 | Dados pessoais tratados conforme a **LGPD** (coleta mínima, finalidade explícita, possibilidade de exclusão). |
| RNF008 | Uploads de imagem com limite de tamanho e tipo validados **no back-end**, não só no front. |
| RNF017 | Rate limiting em endpoints públicos de escrita (Garantir Presença, formulário de contato). |
| RNF018 | Credenciais e segredos via variáveis de ambiente, nunca commitados. |

## 🚀 Desempenho e SEO

| ID | Requisito |
|---|---|
| RNF009 | Páginas públicas rápidas em conexões móveis (`next/image`, paginação, lazy loading). |
| RNF014 | SEO básico: meta tags, sitemap, Open Graph (preview no WhatsApp/redes sociais). |
| RNF016 | Páginas de conteúdo pouco variável (Sacramentos, Pastorais, Sobre Nós) com cache/ISR. |

## 🛠️ Operação e Qualidade

| ID | Requisito |
|---|---|
| RNF010 | Backup periódico do banco de dados. |
| RNF011 | Log básico de ações críticas no admin (quem criou/editou/removeu o quê). |
| RNF012 | Disponibilidade adequada, sem downtime planejado em horários de pico. |
| RNF019 | Testes automatizados mínimos nas regras críticas (ex.: exclusividade Missa/Evento em Escala, permissões por cargo). |
