# Projeto: Sistema Institucional e de Gestão para Paróquia
 
## 1. Visão Geral
 
Este projeto consiste no desenvolvimento de um sistema completo para uma paróquia (igreja local), composto por duas frentes principais:
 
1. **Site Institucional (público)** — voltado para a comunidade e visitantes, com informações sobre a paróquia, programação, eventos, sacramentos, pastorais, galeria de fotos e contato.
2. **Painel Administrativo (admin)** — voltado para a gestão interna da paróquia, permitindo alimentar o conteúdo do site institucional e gerenciar missas, eventos e escalas de serviço.
O projeto pode crescer em escopo após a primeira entrega, mas o MVP (primeira versão) está descrito abaixo.
 
## 2. Stack Tecnológica
 
- **Front-end**: Next.js (já iniciado)
- **Back-end**: em definição — candidato principal é NestJS (a confirmar)
- **Banco de dados**: a definir
- **Autenticação/permissões do admin**: a definir (ver seção 4)
> Sempre que for gerar código, componentes ou arquitetura, considerar Next.js no front. Para o back, perguntar/confirmar antes de assumir NestJS como definitivo, a menos que já tenha sido confirmado em conversa posterior.
 
## 3. Site Institucional (público)
 
Objetivo: reunir todas as informações importantes da paróquia de forma rápida e fácil de acessar. Páginas previstas:
 
### 3.1 Página Inicial (Home)
- Visão geral rápida com destaques (próximos eventos, comunicados recentes, horários de missa).
### 3.2 Comunicados
- Funciona como uma página de notícias, mas exclusiva da paróquia (avisos, informes, mensagens da comunidade).
### 3.3 Calendário
- Exibe a programação do mês corrente da paróquia.
- Deve permitir visualizar também meses futuros, conforme a programação for cadastrada.
### 3.4 Eventos
- Lista de eventos passados (histórico) e futuros (programados).
- Cada evento deve ter uma página/detalhe próprio (data, descrição, local, etc.).
### 3.5 Sacramentos
- Página principal lista todos os sacramentos (Batismo, Primeira Eucaristia, Crisma, Matrimônio, Confissão, etc.).
- Ao clicar em um sacramento, abre uma página específica explicando o que é aquele sacramento (e possivelmente informações práticas: como se preparar, documentos necessários, contato).
### 3.6 Galeria
- Exibe fotos tiradas dos eventos já realizados.
- Provavelmente organizada por evento/álbum.
### 3.7 Pastorais
- Página apresentando as pastorais existentes na paróquia (grupos de atuação: catequese, liturgia, caridade, jovens, etc.).
### 3.8 Sobre Nós
- História da paróquia, missão, padre responsável, informações institucionais.
### 3.9 Contatos
- Endereço, telefone, e-mail, redes sociais, formas de contato com a secretaria paroquial.
## 4. Painel Administrativo (Admin)
 
Objetivo: permitir que a equipe da paróquia gerencie o conteúdo do site e a operação interna, sem depender de desenvolvedores.
 
### 4.1 Perfis de usuário (a confirmar)
- Provável necessidade de múltiplos perfis com permissões diferentes, por exemplo:
  - **Administrador geral**: acesso total.
  - **Secretaria**: gestão de comunicados, eventos, calendário, contatos.
  - **Coordenador de pastoral**: gestão do conteúdo da própria pastoral.
- Definir regras de permissão (RBAC) conforme o projeto avançar.
### 4.2 Gestão de Missas
- Cadastro de horários de missas (fixos e especiais/eventuais).
- Vínculo com o calendário público.
### 4.3 Gestão de Eventos
- Criar, editar e remover eventos.
- Upload de fotos para compor a galeria após o evento acontecer.
- Marcar evento como passado/futuro (ou calcular automaticamente pela data).
### 4.4 Gestão de Escalas
Cobre dois tipos de escala:
- **Escala de missas**: organização de leitores, ministros da eucaristia, coroinhas, e outras funções litúrgicas por missa/data.
- **Escala de pastorais/eventos**: organização de voluntários e responsáveis por atividades e eventos das pastorais.
### 4.5 Gestão de Conteúdo do Site Institucional
- CRUD de comunicados.
- CRUD de sacramentos (textos explicativos).
- CRUD de pastorais.
- CRUD de páginas institucionais (Sobre Nós, Contatos).
- Gestão da galeria de fotos.
## 5. Fora de escopo (por enquanto)
- Funcionalidades além das listadas acima ainda não foram definidas, mas o projeto tem expectativa de crescer após a entrega inicial (ex: doações online, transmissão ao vivo, área do fiel/paroquiano, etc. — **não confirmado, apenas hipótese futura**).
## 6. Observações para o Claude ao trabalhar neste projeto
- Sempre considerar Next.js como front-end padrão.
- Não assumir definitivamente NestJS no back-end sem confirmação — tratar como "provável, mas não fechado".
- Ao sugerir modelagem de dados, arquitetura ou fluxos, considerar as duas faces do sistema (público x admin) como aplicações/áreas distintas, mas integradas pelo mesmo banco/conteúdo.
- Priorizar simplicidade e usabilidade para usuários do admin que podem não ser técnicos (equipe da paróquia).
- Documentos adicionais (PDFs) poderão ser anexados posteriormente com: wireframes, regras de negócio detalhadas, modelo de dados, identidade visual, etc. Esses documentos devem complementar e, em caso de conflito, prevalecer sobre as descrições gerais deste texto.
 