# Roadmap — DTOs + Validação (nest-api)
 
Repositório: https://github.com/hchepli/nest-api
Ordem pensada por dependência entre entidades (ex: User depende de Role e PastoralGroup, então essas vêm antes).
 
Cada dia abaixo é um prompt pronto pra colar no início da sessão. Cole o prompt do dia, cole o resultado dos comandos de teste quando eu pedir, e seguimos.
 
## Tutorial de referência
 
Usando como apoio conceitual o [django-drf-tutorial](https://github.com/marrcandre/django-drf-tutorial) (tutorial de uma livraria em Django + DRF). A stack é diferente (Django ≠ NestJS), então **não** replicamos código nem pacotes de lá — só os *conceitos* de backend, quando fazem sentido pro nosso projeto. Cada dia abaixo, quando houver uma aula equivalente no tutorial, ela vai citada como referência de leitura (não como código a copiar).
 
## Decisões de infraestrutura já tomadas (não mexer ainda)
 
- **Hospedagem**: futuramente paga, tipo Hostinger — fora de escopo por enquanto, não faz parte deste roadmap.
- **Storage de fotos da galeria**: quando chegar a hora (upload de fotos, Photos/Album), vamos usar **Cloudflare R2** (S3-compatível, egress gratuito — importante pra galeria pública) em vez do Cloudinary que o tutorial usa. Mesmo conceito do tutorial (arquivo tratado como serviço externo via variável de ambiente, seguindo os 12 Fatores) mas com SDK S3 (`@aws-sdk/client-s3`) em vez de biblioteca específica do Django. **Isso é uma etapa futura, não faz parte dos 8 dias de DTO+validação abaixo.**
---
 
## Dia 1 — Setup global + Role + PastoralGroup
 
> **Referência conceitual**: [Aula 31 — Validação dos campos no Serializer](https://github.com/marrcandre/django-drf-tutorial#31-validação-dos-campos-no-serializer) do tutorial. Lá a validação é feita no Serializer do DRF; no nosso caso o equivalente é o DTO + class-validator + ValidationPipe. O princípio é o mesmo: validar entrada antes de chegar no service/banco, devolver erro 400 com mensagem clara por campo.
 
```
Vamos continuar o back-end do sistema paroquial (repo hchepli/nest-api).
Hoje é o Dia 1 do roadmap de DTOs + validação: setup global + entidades Role e PastoralGroup.
 
Contexto: os DTOs foram gerados vazios via `nest g resource --no-spec`
(ex: `export class CreateMassDto {}`). Nenhuma validação existe ainda.
Schema.prisma já está migrado e funcionando, Swagger já está em /docs.
 
O que fazer hoje:
1. Instalar class-validator e class-transformer.
2. Ativar ValidationPipe global no main.ts (whitelist: true, forbidNonWhitelisted: true, transform: true).
3. Preencher CreateRoleDto e CreateVoluntarioDto -> na verdade: CreateRoleDto e CreatePastoralGroupDto
   com os campos do schema.prisma (model Role e model PastoralGroup), com decorators
   @ApiProperty (swagger) + @IsString/@IsOptional/@MaxLength etc (class-validator).
4. UpdateRoleDto e UpdatePastoralGroupDto via PartialType do @nestjs/swagger (não do @nestjs/mapped-types,
   trocar o import pra aparecer certo na doc do Swagger).
5. Não mexer nos services ainda — só DTO e validação nesta etapa.
 
Preciso que você gere os arquivos completos (create/update dto) pras duas entidades.
```
 
**Teste de erro (rodar depois, com `npm run start:dev` de pé):**
```bash
# Deve dar 400 (nome ausente)
curl -X POST http://localhost:3000/roles -H "Content-Type: application/json" -d "{}"
 
# Deve dar 400 (campo que não existe no DTO, por causa do forbidNonWhitelisted)
curl -X POST http://localhost:3000/roles -H "Content-Type: application/json" -d "{\"nome\":\"Teste\",\"campoInvalido\":123}"
 
# Deve dar 201
curl -X POST http://localhost:3000/roles -H "Content-Type: application/json" -d "{\"nome\":\"Teste\"}"
```
Também conferir no navegador: `http://localhost:3000/docs` → o schema do body de `POST /roles` deve aparecer com os campos certos.
 
---
 
## Dia 2 — User + Volunteer
 
```
Dia 2 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dia 1 já feito: ValidationPipe global ativo, Role e PastoralGroup com DTO+validação prontos.
 
Hoje: CreateUserDto/UpdateUserDto e CreateVolunteerDto/UpdateVolunteerDto.
 
Atenção nos pontos de regra de negócio (RN006, RNF005):
- User.email precisa @IsEmail.
- User.password (nome do campo que vem do form, não confundir com passwordHash do banco)
  precisa @MinLength adequado — o hash em si é feito no service, não no DTO.
- User.pastoralGroupId é opcional no DTO, mas é obrigatório SE o cargo for
  "Coordenador de Pastoral" — só documentar isso por enquanto com @ApiPropertyOptional
  e um comentário; a validação condicional de verdade fica pro service (RN006), não é
  responsabilidade do DTO.
- Volunteer.phone obrigatório, email opcional.
 
Gere os 4 arquivos de DTO completos.
```
 
**Teste de erro:**
```bash
# Deve dar 400 (email inválido)
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"nome\":\"Teste\",\"email\":\"nao-e-email\",\"password\":\"123456\",\"roleId\":1}"
 
# Deve dar 400 (senha curta demais, se MinLength=8 por ex)
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"nome\":\"Teste\",\"email\":\"a@a.com\",\"password\":\"123\",\"roleId\":1}"
 
# Volunteer sem telefone -> 400
curl -X POST http://localhost:3000/volunteers -H "Content-Type: application/json" -d "{\"nome\":\"Fulano\"}"
```
 
---
 
## Dia 3 — Category + Mass
 
```
Dia 3 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dias 1-2 já feitos: Role, PastoralGroup, User, Volunteer com DTO+validação.
 
Hoje: CreateCategoryDto/UpdateCategoryDto e CreateMassDto/UpdateMassDto.
 
Pontos de atenção:
- Category.type é enum (EVENT | ANNOUNCEMENT) -> usar @IsEnum(CategoryType) importando
  o enum gerado pelo Prisma (../../generated/prisma/client ou de onde os enums forem exportados
  nessa versão — confirme o caminho certo olhando o client gerado).
- Mass.type é enum (COMMON | SPECIAL), com default COMMON — no DTO deixar @IsOptional
  já que tem default no banco.
- Mass.dateTime precisa @IsDateString ou @IsISO8601 (vem como string no JSON, o Prisma converte).
 
Gere os 4 arquivos.
```
 
**Teste de erro:**
```bash
# Category com type inválido -> 400
curl -X POST http://localhost:3000/categories -H "Content-Type: application/json" -d "{\"name\":\"Teste\",\"type\":\"QUALQUER_COISA\"}"
 
# Mass com data em formato errado -> 400
curl -X POST http://localhost:3000/masses -H "Content-Type: application/json" -d "{\"title\":\"Missa Teste\",\"dateTime\":\"25 de dezembro\",\"location\":\"Igreja Matriz\"}"
 
# Mass válida -> 201
curl -X POST http://localhost:3000/masses -H "Content-Type: application/json" -d "{\"title\":\"Missa Teste\",\"dateTime\":\"2026-12-25T19:00:00.000Z\",\"location\":\"Igreja Matriz\"}"
```
 
---
 
## Dia 4 — Event
 
```
Dia 4 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dias 1-3 já feitos.
 
Hoje: só Event (CreateEventDto/UpdateEventDto) — dia dedicado porque tem mais campos e
relações opcionais (categoryId, massId, endDate) que merecem atenção.
 
Pontos de atenção:
- name obrigatório, slug: por ora @IsString @IsOptional no DTO de criação (a geração
  automática do slug a partir do nome fica pro service, não pro DTO — não implementar isso hoje).
- startDate obrigatório (@IsISO8601), endDate opcional (@IsISO8601 @IsOptional).
- categoryId e massId opcionais (@IsInt @IsOptional) — é o vínculo opcional com Mass (RN002).
- status: enum ACTIVE/CANCELLED com default ACTIVE, @IsOptional no create.
 
Gere os 2 arquivos.
```
 
**Teste de erro:**
```bash
# Sem startDate -> 400
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"name\":\"Festa Junina\",\"location\":\"Salão Paroquial\"}"
 
# endDate antes de startDate -- validar se DTO cobre isso ou se fica pro service (perguntar antes de assumir)
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"name\":\"Festa Junina\",\"startDate\":\"2026-06-20T00:00:00.000Z\",\"endDate\":\"2026-06-01T00:00:00.000Z\",\"location\":\"Salão Paroquial\"}"
 
# Válido -> 201
curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"name\":\"Festa Junina\",\"startDate\":\"2026-06-20T00:00:00.000Z\",\"location\":\"Salão Paroquial\"}"
```
 
---
 
## Dia 5 — Schedule + ScheduleAssignment
 
```
Dia 5 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dias 1-4 já feitos.
 
Hoje: CreateScheduleDto/UpdateScheduleDto e CreateScheduleAssignmentDto/UpdateScheduleAssignmentDto.
 
Ponto crítico (RN007): Schedule deve ter massId OU eventId, nunca os dois nem nenhum.
Isso é regra de negócio, não validação simples de campo — combinamos antes que fica no
SERVICE, não no DTO. Então hoje no DTO só: massId e eventId como @IsInt @IsOptional
cada um (ambos opcionais no nível do DTO), e um comentário no código apontando que a
regra XOR é responsabilidade do ScheduleService (próxima etapa do roadmap geral, não hoje).
 
ScheduleAssignment: scheduleId (@IsUUID), volunteerId (@IsInt), role/funcao (@IsString,
lista sugerida de valores comuns tipo leitor/ministro_eucaristia/coroinha mas SEM travar
com @IsEnum ainda, porque é campo de texto livre no schema — confirmar comigo antes se
quiser travar como enum futuramente).
 
Gere os 4 arquivos.
```
 
**Teste de erro:**
```bash
# Sem massId nem eventId -> hoje passa no DTO (é esperado, regra fica pro service)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{}"
 
# ScheduleAssignment sem volunteerId -> 400
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"role\":\"leitor\"}"
```
(Nesta etapa é esperado que a regra RN007 ainda NÃO seja bloqueada — isso é intencional, vamos implementar no service depois. Só confirmar que o DTO aceita os campos certos.)
 
---
 
## Dia 6 — Announcement + Sacrament
 
```
Dia 6 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dias 1-5 já feitos.
 
Hoje: CreateAnnouncementDto/UpdateAnnouncementDto e CreateSacramentDto/UpdateSacramentDto.
 
Pontos de atenção:
- Announcement.status enum (DRAFT/PUBLISHED) default PUBLISHED, @IsOptional no create.
- Announcement.authorId NÃO deve vir no DTO do body — vai ser preenchido pelo service
  a partir do usuário autenticado (quando auth existir). Por enquanto deixar de fora do DTO
  mesmo, com um comentário explicando o motivo.
- Announcement.imageUrl opcional (@IsString @IsOptional; validação de tipo/tamanho de
  arquivo de verdade é upload, RNF008, fica pra outra etapa).
- Sacrament.faq é Json no schema — no DTO usar @IsOptional e um tipo any[] ou objeto,
  documentar no Swagger como array de perguntas/respostas (perguntar formato se não
  estiver claro, não inventar estrutura fixa sem confirmar).
- Sacrament.displayOrder (@IsInt @IsOptional, default 0).
 
Gere os 4 arquivos.
```
 
**Teste de erro:**
```bash
curl -X POST http://localhost:3000/announcements -H "Content-Type: application/json" -d "{\"title\":\"Teste\"}"
# Deve dar 400 (falta content)
 
curl -X POST http://localhost:3000/sacraments -H "Content-Type: application/json" -d "{\"name\":\"Batismo\"}"
# Deve dar 400 (falta description, que é obrigatório no schema)
```
 
---
 
## Dia 7 — Album + Photo
 
```
Dia 7 do roadmap de DTOs + validação (repo hchepli/nest-api).
Dias 1-6 já feitos.
 
Hoje: CreateAlbumDto/UpdateAlbumDto e CreatePhotoDto/UpdatePhotoDto.
 
Pontos de atenção:
- Album.eventId opcional (@IsInt @IsOptional) — vínculo opcional com Event (RN003, álbum avulso).
- Photo.albumId obrigatório (@IsInt).
- Photo.url: por enquanto @IsString — o upload de arquivo de verdade (multipart, RNF008)
  é uma etapa separada do roadmap, não fazer hoje, só o DTO aceitando a URL/path já processado.
- Photo.isCover opcional (@IsBoolean @IsOptional, default false) — regra de "só 1 capa por
  álbum" (RN010) fica pro service, não pro DTO (já decidido antes).
 
Gere os 4 arquivos.
```
 
**Teste de erro:**
```bash
curl -X POST http://localhost:3000/albums -H "Content-Type: application/json" -d "{}"
# Deve dar 400 (falta title)
 
curl -X POST http://localhost:3000/photos -H "Content-Type: application/json" -d "{\"url\":\"foto.jpg\"}"
# Deve dar 400 (falta albumId)
```
 
---
 
## Dia 8 — AttendanceConfirmation + AuditLog + Permission
 
```
Dia 8 do roadmap de DTOs + validação (repo hchepli/nest-api) — último dia dessa etapa.
Dias 1-7 já feitos: todas as entidades de conteúdo com DTO+validação prontos.
 
Hoje: as 3 entidades que sobraram.
 
- CreateAttendanceConfirmationDto/Update: eventId (@IsInt), name (@IsString), contact
  (@IsString — pode ser telefone ou email, então texto livre mesmo). ipAddress NÃO entra
  no DTO do body (é capturado do request pelo service/controller, não enviado pelo cliente).
  Esse é o endpoint público sem login (RF012) — atenção que rate limiting (RNF017) é
  outra etapa do roadmap, não fazer hoje.
- CreateAuditLogDto/Update: é preenchido pelo sistema internamente (interceptor,
  etapa futura do roadmap), não por request manual do usuário. Preencher o DTO mesmo
  assim pra manter o padrão do CRUD gerado, mas comentar que na prática esse endpoint
  provavelmente vai ficar restrito/read-only quando o RBAC entrar.
- CreatePermissionDto/Update: roleId (@IsInt), resource (@IsString), canCreate/canEdit/
  canDelete/canView (@IsBoolean @IsOptional cada, default false).
 
Gere os 6 arquivos. Ao final desse dia, todas as 15 entidades do MVP têm DTO + validação.
```
 
**Teste de erro:**
```bash
curl -X POST http://localhost:3000/attendance-confirmations -H "Content-Type: application/json" -d "{\"name\":\"Fulano\"}"
# Deve dar 400 (falta eventId e contact)
 
curl -X POST http://localhost:3000/attendance-confirmations -H "Content-Type: application/json" -d "{\"eventId\":1,\"name\":\"Fulano\",\"contact\":\"11999999999\"}"
# Deve dar 201 (assumindo que existe Event com id 1 no banco)
```
 
**Ao terminar o Dia 8:** conferir o Swagger (`/docs`) inteiro, entidade por entidade, e ver se todos os bodies aparecem certinho. Esse é o ponto de fechar a etapa "DTOs + validação" do roadmap geral e começar o próximo bloco: Auth (login + JWT).
 
---
 
## Prévia: próximos blocos do roadmap geral e aulas de referência
 
Só pra você ter noção do que vem depois dos 8 dias acima (ainda não são prompts prontos, isso a gente detalha quando chegar a vez):
 
| Bloco do roadmap geral | Aula equivalente no tutorial (conceito, não código) |
|---|---|
| Auth (login + JWT, RN015) | [Aula 16 — Autenticação e autorização](https://github.com/marrcandre/django-drf-tutorial#16-autenticação-e-autorização) e [Aula 18 — Autenticação com SimpleJWT](https://github.com/marrcandre/django-drf-tutorial#18-autenticação-com-o-simplejwt) — lá é SimpleJWT (Django), no nosso caso vai ser `@nestjs/jwt` + `@nestjs/passport`, mas o fluxo (login gera access token, token vai no header `Authorization: Bearer`) é o mesmo. |
| RBAC por cargo (RN004/RN005) | [Aula 17 — Utilização das permissões do DRF](https://github.com/marrcandre/django-drf-tutorial#17-utilização-das-permissões-do-drf) — conceito de restringir endpoint por papel do usuário. No Nest vamos fazer com Guards customizados em vez das `permission_classes` do DRF. |
| Schedule + ScheduleAssignment (criação aninhada) | [Aula 27 — Criação de compras com itens aninhados via API](https://github.com/marrcandre/django-drf-tutorial#27-criação-de-compras-com-itens-aninhados-via-api) — o padrão de criar uma Escala já com as atribuições (voluntário + função) junto no mesmo request é conceitualmente igual ao de criar uma Compra já com os Itens. |
| Upload de fotos (Album/Photo) | [Aula 12 — Upload e associação de imagens](https://github.com/marrcandre/django-drf-tutorial#12-upload-e-associação-de-imagens) e [Aula 19 — Inclusão da foto de perfil no usuário](https://github.com/marrcandre/django-drf-tutorial#19-inclusão-da-foto-de-perfil-no-usuário) — conceito de multipart/form-data + validação de tipo/tamanho (RNF008). No Nest usaríamos `@nestjs/platform-express` com `multer`, e o destino final seria Cloudflare R2 (decisão já tomada, ver topo do arquivo) em vez de disco local/Cloudinary. |
| Filtros, busca e ordenação nas listagens | [Aula 36 — Filtros](https://github.com/marrcandre/django-drf-tutorial#36-utilização-de-filtros-para-listagem-de-recursos), [Aula 37 — Busca textual](https://github.com/marrcandre/django-drf-tutorial#37-utilização-de-busca-textual-em-campos-de-texto) e [Aula 38 — Ordenação](https://github.com/marrcandre/django-drf-tutorial#38-utilização-de-ordenação-dos-resultados) — útil principalmente pra listagem pública de Eventos/Comunicados e pro relatório de Escalas (RF008). |
| Ações personalizadas (ex: relatório de escalas) | [Aula 35b — Ações personalizadas e relatório de vendas do mês](https://github.com/marrcandre/django-drf-tutorial#35b-ações-personalizadas-em-coleções-e-relatório-de-vendas-do-mês) — mesmo conceito pro nosso "Relatório de Escalas" (RF008/UC023): um endpoint de ação/agregação além do CRUD padrão. |
| Teste via linha de comando | [Apêndice A9 — Uso do curl para testar a API](https://github.com/marrcandre/django-drf-tutorial#a9-uso-do-curl-para-testar-a-api-via-linha-de-comando) — mesma lógica dos comandos `curl` que já estamos usando nos testes de cada dia acima. |
 
Essas referências são só apoio de leitura — quando chegarmos em cada bloco, a gente detalha o prompt do dia específico pro NestJS, do jeito que fizemos com os 8 dias de DTO acima.
 
 