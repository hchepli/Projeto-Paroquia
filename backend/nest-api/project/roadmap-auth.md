# Roadmap — Auth (Login + JWT) + Dia 0 (Prisma real)
 
Repositório: https://github.com/hchepli/nest-api
Pré-requisito: Dias 1–8 do [roadmap-backend.md](./roadmap-backend.md) (DTOs + validação) concluídos.
 
> **Referência conceitual**: [Aula 16 — Autenticação e autorização](https://github.com/marrcandre/django-drf-tutorial#16-autenticação-e-autorização) e [Aula 18 — Autenticação com SimpleJWT](https://github.com/marrcandre/django-drf-tutorial#18-autenticação-com-o-simplejwt). Lá é SimpleJWT (Django); no nosso caso será `@nestjs/jwt` + `@nestjs/passport`, mas o fluxo é o mesmo: login gera access token, token vai no header `Authorization: Bearer`.
 
Escopo do MVP (RN015): **login simples usuário/senha, sem 2FA** (2FA é RF003, fase futura).
 
## Contexto importante (descoberto ao iniciar este bloco)
 
Os services de todas as 15 entidades foram gerados via `nest g resource --no-spec` e, até o início deste roadmap, **ainda estavam no esqueleto padrão do Nest** (retornam strings fixas, sem tocar no Prisma/banco). Por isso foi inserido um **Dia 0**, focado apenas em `Role` e `User` — o mínimo necessário pra destravar o hash de senha e o login. As outras 13 entidades (Volunteer, Mass, Event, Category, Schedule, ScheduleAssignment, Announcement, Sacrament, Album, Photo, AttendanceConfirmation, AuditLog, Permission) continuam no esqueleto e serão conectadas ao Prisma numa etapa própria, depois do Auth.
 
---
 
## Dia 0 — PrismaModule/PrismaService + Role e User reais
 
```
Vamos destravar o Dia 1 do roadmap de Auth (repo hchepli/nest-api).
 
Contexto: os services foram gerados via `nest g resource --no-spec` e ainda
estão no esqueleto padrão (retornam strings fixas tipo "This action adds a
new role", sem tocar no banco). O schema.prisma já existe e está migrado.
 
Hoje: Dia 0 — conectar Prisma de verdade, só em Role e User por enquanto
(o suficiente pra destravar o hash de senha do Dia 1 de Auth).
 
O que fazer:
1. Se ainda não existir, criar PrismaModule + PrismaService (padrão comum:
   PrismaService extends PrismaClient implements OnModuleInit, com
   onModuleInit() chamando this.$connect()). Marcar o PrismaModule como
   @Global() e exportar o PrismaService, pra não precisar importar em todo
   módulo.
2. Injetar PrismaService no RolesService e implementar de verdade:
   - create: this.prisma.role.create({ data: createRoleDto })
   - findAll: this.prisma.role.findMany()
   - findOne: this.prisma.role.findUnique({ where: { id } }) — se não achar,
     lançar NotFoundException (@nestjs/common)
   - update: this.prisma.role.update({ where: { id }, data: updateRoleDto })
   - remove: this.prisma.role.delete({ where: { id } })
3. Injetar PrismaService no UsersService e implementar de verdade (mesma
   lógica do Role), MAS:
   - No create, NÃO salvar createUserDto.password direto — deixar um
     comentário // TODO: hash da senha (Dia 1 do Auth) pra eu completar
     amanhã, e por hoje salvar temporariamente em passwordHash sem hash
     mesmo (só pra validar a persistência), OU já aplicar bcrypt.hash aqui
     se preferir adiantar — me pergunte qual das duas antes de escolher.
   - Nunca retornar passwordHash na resposta (usar exclusão manual do campo
     no objeto retornado, tipo `const { passwordHash, ...rest } = user;
     return rest;` — não precisa de class-transformer ainda, isso é
     refinamento futuro).
   - findOne por id (não por email ainda — isso é específico do Auth,
     fica pro Dia 2 do roadmap de Auth: findByEmail).
4. Tratar erros comuns do Prisma (ex: P2002 - unique constraint violation em
   email duplicado) com um catch simples convertendo pra ConflictException,
   sem exagerar em abstração agora.
5. NÃO mexer nos outros 13 services (Volunteer, Mass, Event, Category,
   Schedule, ScheduleAssignment, Announcement, Sacrament, Album, Photo,
   AttendanceConfirmation, AuditLog, Permission) — ficam de esqueleto por
   enquanto, é etapa separada.
 
Me pergunte sobre o ponto do hash de senha antes de decidir.
```
 
**Teste:**
```bash
# Criar Role de verdade
curl -X POST http://localhost:3000/roles -H "Content-Type: application/json" -d "{\"nome\":\"Admin Geral\"}"
# Deve persistir no banco (conferir com GET depois, não mais string fixa)
 
curl -X GET http://localhost:3000/roles
# Deve retornar array com o Role criado, vindo do banco
 
# Criar User de verdade (roleId = id retornado acima)
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"nome\":\"Teste Auth\",\"email\":\"auth@teste.com\",\"password\":\"senha12345\",\"roleId\":1}"
# Deve persistir e a resposta NÃO deve conter passwordHash
 
# Email duplicado -> 409 (não erro 500 cru do Prisma)
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"nome\":\"Outro\",\"email\":\"auth@teste.com\",\"password\":\"senha12345\",\"roleId\":1}"
 
# GET de id inexistente -> 404
curl -X GET http://localhost:3000/roles/999
```
 
---
 
## Dia 1 — Setup do módulo Auth + hash de senha
 
```
Vamos iniciar o bloco de Auth do sistema paroquial (repo hchepli/nest-api).
Dia 1 do roadmap de Auth: setup do módulo e hash de senha.
 
Contexto: o Dia 0 já conectou RolesService e UsersService ao Prisma de
verdade. CreateUserDto já tem campo `password` (@MinLength(8)).
 
O que fazer hoje:
1. Instalar bcrypt (ou argon2 — sugerir os dois com prós/contras, não decidir sozinho) e @types/bcrypt se aplicável.
2. Criar módulo `auth` (nest g module auth, nest g service auth, nest g controller auth --no-spec).
3. No UsersService (create), gerar o hash da senha (bcrypt.hash) antes de persistir,
   e NUNCA retornar passwordHash nas respostas (usar class-transformer @Exclude()
   na entity/response, ou omitir manualmente no service).
4. Não implementar login ainda — só garantir que o hash está sendo gerado corretamente
   na criação de usuário.
 
Me pergunte antes de decidir bcrypt vs argon2 definitivamente.
```
 
**Teste:**
```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"nome\":\"Teste Auth\",\"email\":\"auth@teste.com\",\"password\":\"senha12345\",\"roleId\":1}"
# Conferir no banco (ou log) que passwordHash está com hash, não texto puro,
# e que a resposta do endpoint NÃO retorna passwordHash.
```
 
---
 
## Dia 2 — Estratégia Local (validação de credenciais)
 
```
Dia 2 do roadmap de Auth. Dia 1 já feito: hash de senha funcionando no UsersService.
 
Hoje: LocalStrategy (passport-local) para validar email+senha no login.
 
1. Instalar passport, passport-local, @nestjs/passport, @types/passport-local.
2. Criar AuthService.validateUser(email, password): busca User por email,
   compara com bcrypt.compare, retorna o User sem passwordHash se válido,
   ou null/exception se inválido.
3. Criar LocalStrategy extends PassportStrategy(Strategy) usando o validateUser.
4. Ainda NÃO criar o endpoint de login completo — só a estratégia e o service,
   testado isoladamente (pode ser via teste unitário simples ou log).
 
Atenção RN015: mensagem de erro genérica em credenciais inválidas (não indicar
se é email ou senha errados — UC007, fluxo 3a).
```
 
---
 
## Dia 3 — JWT: geração e endpoint de login
 
```
Dia 3 do roadmap de Auth. Dias 1-2 já feitos.
 
Hoje: gerar o JWT de verdade e criar o endpoint POST /auth/login.
 
1. Instalar @nestjs/jwt.
2. Configurar JwtModule (secret via variável de ambiente, RNF018 — nunca hardcoded;
   expiresIn a definir, sugerir opções tipo 1h/8h/1d e perguntar antes de fixar).
3. AuthService.login(user): gera o payload (sub: user.id, email, role) e retorna
   { access_token }.
4. AuthController: POST /auth/login usando LocalStrategy (via LocalAuthGuard) +
   chama authService.login().
5. Login de usuário INATIVO deve ser bloqueado (RN004 / UC007 fluxo 3b) — checar
   status no validateUser antes de gerar token.
 
Pergunte sobre o tempo de expiração do token antes de fixar um valor.
```
 
**Teste:**
```bash
# Login válido -> 200/201 com access_token
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"auth@teste.com\",\"password\":\"senha12345\"}"
 
# Senha errada -> 401 com mensagem genérica
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"auth@teste.com\",\"password\":\"errada\"}"
 
# Email inexistente -> 401 com a MESMA mensagem genérica (não revelar que o email não existe)
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"naoexiste@teste.com\",\"password\":\"qualquer\"}"
```
 
---
 
## Dia 4 — JwtStrategy + Guard global
 
```
Dia 4 do roadmap de Auth. Dias 1-3 já feitos: login retornando access_token válido.
 
Hoje: proteger os endpoints existentes exigindo o token.
 
1. Criar JwtStrategy extends PassportStrategy(Strategy, 'jwt') validando o token
   (secret da env) e retornando o payload decodificado como req.user.
2. Criar JwtAuthGuard.
3. Aplicar o Guard GLOBALMENTE (APP_GUARD no AppModule) — por padrão TODOS os
   endpoints passam a exigir token, exceto os explicitamente marcados como público.
4. Criar decorator @Public() (SetMetadata) para marcar as rotas que devem
   continuar acessíveis sem login:
   - POST /auth/login (óbvio)
   - GET de conteúdo público (eventos, comunicados, sacramentos, pastorais, missas
     — leitura, conforme UC014/UC019/UC026/UC032/UC034)
   - POST /attendance-confirmations (RF012 — Garantir Presença, sem login)
5. Ajustar o Guard pra checar @Public() antes de bloquear.
 
IMPORTANTE: não decidir sozinho quais rotas além dessas ficam públicas — listar
as que você identificar como candidatas e me perguntar antes de aplicar @Public()
em qualquer uma que não esteja no roadmap de casos de uso.
```
 
**Teste:**
```bash
# Sem token, em rota protegida -> 401
curl -X GET http://localhost:3000/users
 
# Com token válido -> 200
curl -X GET http://localhost:3000/users -H "Authorization: Bearer SEU_TOKEN_AQUI"
 
# Rota pública sem token -> 200 (ex: listagem de eventos)
curl -X GET http://localhost:3000/events
```
 
---
 
## Dia 5 — RBAC por Cargo (Guards customizados)
 
```
Dia 5 do roadmap de Auth — este é o bloco de "RBAC por cargo" do roadmap geral
(RN004/RN005), mas encaixado aqui porque depende do JWT já funcionando.
 
Referência conceitual: Aula 17 do tutorial Django (permission_classes) —
no Nest fazemos com Guards customizados.
 
1. Criar decorator @Roles(...roles: string[]) (SetMetadata) para marcar quais
   cargos podem acessar cada endpoint.
2. Criar RolesGuard que lê os metadados de @Roles() e compara com req.user.role
   (do payload do JWT).
3. Aplicar @Roles('Admin Geral') em endpoints sensíveis (ex: DELETE /roles,
   POST /users) — mas ANTES de aplicar em cada endpoint, me listar quais
   endpoints você mapeou pra quais cargos, baseado no RN005/casos de uso, pra eu
   confirmar (não assumir sozinho a matriz completa de permissões).
4. NÃO implementar ainda a regra "Coordenador de Pastoral só vê/edita a própria
   pastoral" (RN006) — essa é regra de ESCOPO DE DADOS, não de cargo simples,
   fica pra uma etapa separada (provavelmente dentro dos services de Schedule/
   PastoralGroup, filtrando por pastoralGroupId do usuário logado).
```
 
---
 
## Dia 6 — Escopo de dados por Pastoral (RN006/RN008)
 
```
Dia 6 do roadmap de Auth. Dias 1-5 já feitos: RBAC básico por cargo funcionando.
 
Hoje: a regra RN006/RN008 — Coordenador de Pastoral só acessa Escalas/Pastoral
da própria pastoral.
 
1. No ScheduleService (findAll de relatório, UC023) e no PastoralGroupService,
   se o usuário logado (req.user) tem role = 'Coordenador de Pastoral', filtrar
   automaticamente os resultados por req.user.pastoralGroupId.
2. Se o Coordenador tentar acessar/editar uma Escala ou Pastoral fora da sua
   (ex: por ID direto na URL), bloquear com 403 Forbidden, não 404.
3. Admin Geral e Secretaria continuam vendo tudo sem filtro.
 
Ponto em aberto: confirmar se esse filtro fica no service (mais simples) ou
via Guard próprio (mais reutilizável) — sugerir os dois, não decidir sozinho.
```
 
---
 
## Dia 7 — Revisão final e ajustes finos
 
```
Dia 7 (fechamento do bloco Auth). Dias 1-6 já feitos.
 
Hoje: revisão geral, sem feature nova.
 
1. Conferir Swagger: marcar rotas protegidas com @ApiBearerAuth() e configurar
   o botão "Authorize" no /docs (addBearerAuth no main.ts).
2. Revisar UC003 (pendência do doc de casos de uso): impedir inativação do
   último Admin Geral ativo — perguntar se implementamos essa trava agora ou
   deixamos como pendência formal.
3. Conferir se o login bloqueia corretamente usuário INATIVO (RN004/UC007).
4. Rodar a bateria de testes de todos os dias anteriores (1-6) de uma vez,
   simulando os 3 cargos (Admin Geral, Secretaria, Coordenador de Pastoral).
```
 
---
 
## Depois do Auth
 
Decidir junto a ordem entre:
- **CRUD real via Prisma** para as 13 entidades restantes (Volunteer, Mass, Event, Category, Schedule, ScheduleAssignment, Announcement, Sacrament, Album, Photo, AttendanceConfirmation, AuditLog, Permission) — ainda no esqueleto padrão.
- **Filtros, busca e ordenação** nas listagens (RF008 — relatório de escalas; útil também pra Eventos/Comunicados públicos).
- **Upload de fotos via Cloudflare R2** (Album/Photo) — decisão de infra já tomada (ver `roadmap-backend.md`).
Todos já mapeados no roadmap geral anterior; retomar a numeração de dias quando a ordem for definida.
 