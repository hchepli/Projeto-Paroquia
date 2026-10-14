# Roadmap — Auditoria/Seed + Upload de Fotos (Cloudflare R2)

Repositório: https://github.com/hchepli/nest-api
Pré-requisito: Roadmap de Auth (roadmap-auth.md) concluído — Dias 0-7.

Cada dia abaixo é um prompt pronto pra colar no início da sessão. Cole o prompt do dia, cole o resultado dos comandos de teste quando eu pedir, e seguimos.

## Decisão de infraestrutura já tomada (ver roadmap-backend.md)

Storage de fotos da galeria: **Cloudflare R2** (S3-compatível, egress gratuito — importante pra galeria pública), usando SDK S3 (`@aws-sdk/client-s3`) em vez de biblioteca específica.

---

## Dia 0 — Auditoria das 15 entidades + Seed do banco

```
Vamos começar o bloco de Upload de Fotos (repo hchepli/nest-api), mas antes
preciso de um Dia 0 de auditoria + seed.

Contexto: ao longo do roadmap de Auth, fomos editando services/controllers
sob demanda (users, roles, schedules, pastoral-groups, announcements,
categories, masses, events, sacraments, albums, photos, volunteers,
schedule-assignment, attendance-confirmations, permission, audit-logs).
Não temos certeza se TODAS as 15 entidades já saíram do esqueleto padrão
do Nest (`nest g resource --no-spec`, que retorna strings fixas) e estão
de fato usando PrismaService.

O que fazer hoje:

1. AUDITORIA: para cada uma das 15 entidades/services abaixo, verificar
   se o service injeta PrismaService e faz operações reais no banco
   (create/findMany/findUnique/update/delete), ou se ainda está no
   esqueleto ("This action adds a new X" / retorno de string fixa):
   - Role, Permission, PastoralGroup, User, Volunteer, Mass, Category,
     Event, Schedule, ScheduleAssignment, Announcement, Album, Photo,
     Sacrament, AttendanceConfirmation, AuditLog
   Me devolver uma tabela simples: Entidade | Status (Prisma real / Esqueleto)
   | Observação (ex: falta tratamento de erro P2002/P2003, falta @Roles, etc).

2. Para qualquer entidade que AINDA estiver no esqueleto, implementar o
   CRUD real via Prisma seguindo o MESMO padrão já usado nas entidades
   prontas (NotFoundException em findOne, tratamento de P2002/P2003,
   exclusão de campos sensíveis quando aplicável).

3. SEED: criar um script de seed (prisma/seed.ts, registrado no
   package.json em "prisma": { "seed": "..." }) que popule o banco com
   dados mínimos de teste para TODAS as entidades, respeitando as
   dependências entre elas (Role/PastoralGroup antes de User, Mass antes
   de Event/Schedule, etc). Sugestão de volume: o suficiente pra testar
   RBAC e RN006 (pelo menos 2 PastoralGroups, 1 User de cada cargo -
   Admin Geral/Secretaria/Coordenador de Pastoral -, 2 Volunteers,
   2 Masses, 2 Events, 1 Schedule por pastoral, 1 Category de cada tipo,
   2 Announcements - 1 DRAFT e 1 PUBLISHED -, 1 Sacrament, 1 Album sem
   evento e 1 vinculado a evento, 2 Photos no álbum vinculado).
   As senhas dos Users devem ser hasheadas de verdade (usar bcrypt no
   próprio script de seed, não inserir texto puro).

4. Rodar o seed e conferir que populou sem erro.

Antes de gerar o seed completo, me mostra a tabela de auditoria do item 1
primeiro, pra eu confirmar se bate com o que eu esperava antes de você
gerar os dados de teste.
```

**Teste de conferência (rodar depois do seed):**
```bash
npx prisma studio
```
Abrir o Prisma Studio e conferir visualmente se todas as tabelas populadas
batem com o que foi pedido (2 pastorais, usuários com cargos certos, etc).

---

## Dia 1 — Setup Cloudflare R2 (conta, bucket, credenciais)

> Etapa de infraestrutura, fora do código — fazer antes de codar.

```
Checklist pra fazer no painel da Cloudflare (fora do código):
1. Criar conta Cloudflare (se ainda não tiver) e ativar R2.
2. Criar um bucket (ex: paroquia-fotos ou paroquia-galeria).
3. Gerar um API Token de R2 (Account API Token) com permissão de
   leitura/escrita nesse bucket específico.
4. Anotar: Account ID, Access Key ID, Secret Access Key, nome do bucket,
   e o endpoint S3 do R2 (formato:
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com).
5. (Opcional, mas recomendado pra galeria pública) Configurar um domínio
   público/custom domain pro bucket, ou usar o r2.dev subdomain de teste,
   pra gerar URLs públicas de acesso direto às fotos sem precisar de
   signed URL a cada request.
```

**Variáveis de ambiente a adicionar no `.env` (NÃO commitar, RNF018):**
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=   # domínio público do bucket, usado para montar a URL final da foto
```

---

## Dia 2 — StorageModule/StorageService (client S3 do R2)

```
Dia 2 do roadmap de Upload de Fotos (repo hchepli/nest-api).
Dia 0 (auditoria+seed) e Dia 1 (setup R2 na Cloudflare) já feitos.

Hoje: criar o serviço que fala com o R2 via SDK S3, ainda sem ligar em
nenhum endpoint de Photo.

O que fazer:
1. Instalar @aws-sdk/client-s3 e @aws-sdk/lib-storage (facilita upload
   de buffers/streams).
2. Criar StorageModule (@Global(), igual o padrão do PrismaModule) +
   StorageService.
3. StorageService deve expor pelo menos:
   - uploadFile(buffer: Buffer, key: string, mimetype: string): Promise<string>
     -> faz o PutObject no bucket R2, retorna a URL pública final
     (usando R2_PUBLIC_URL + key).
   - deleteFile(key: string): Promise<void> -> remove o objeto do bucket
     (útil pra quando uma Photo for removida do sistema).
4. O client S3 deve ser configurado com endpoint customizado apontando
   pro R2 (https://<ACCOUNT_ID>.r2.cloudflarestorage.com), region 'auto',
   e as credenciais vindas das env vars do Dia 1.
5. Gerar a "key" do objeto no bucket de forma organizada, ex:
   `albums/{albumId}/{uuid}-{nomeOriginalSanitizado}` — não usar o nome
   original puro (evita colisão e path traversal).

NÃO mexer no PhotosController/PhotosService ainda — só o StorageService
isolado hoje. Se possível, sugerir um teste manual simples (script solto
ou endpoint temporário) pra confirmar que o upload/delete funcionam antes
de integrar com Photos.
```

**Teste de erro/sucesso (ajustar conforme o teste manual sugerido):**
```bash
# Validar no painel da Cloudflare R2 (ou via Prisma Studio/logs) que o
# arquivo de teste apareceu no bucket após rodar o teste manual do Dia 2.
```

---

## Dia 3 — Endpoint de upload real em Photos (multipart)

```
Dia 3 do roadmap de Upload de Fotos. Dia 2 (StorageService) já feito.

Hoje: ligar o upload de verdade no PhotosController.

Pontos de atenção (RNF008 - validar tipo/tamanho no back, não só no
front):
1. Instalar @nestjs/platform-express e @types/multer.
2. POST /photos deixa de receber só { albumId, url, isCover } no JSON e
   passa a aceitar multipart/form-data: albumId, isCover (campos de
   texto) + file (o arquivo em si).
3. Usar FileInterceptor('file') com limits (fileSize, sugerir um valor
   tipo 5MB e me perguntar antes de fixar) e um fileFilter restringindo
   mimetype a image/jpeg, image/png, image/webp (perguntar se a lista
   está completa antes de travar).
4. No PhotosService.create, receber o buffer do arquivo (memoryStorage,
   não salvar em disco local - vai direto pro R2), chamar
   storageService.uploadFile(...), e usar a URL retornada como o campo
   `url` do Photo no banco (em vez de receber a URL pronta no body).
5. Arquivo inválido (tipo ou tamanho fora do limite) -> 400 com mensagem
   clara ANTES de tentar subir pro R2 (não desperdiçar upload com arquivo
   que vai ser rejeitado).
6. Manter a regra de RN010 (capa única por álbum) como já estava - isso
   é lógica de negócio, não muda com o upload.

Me pergunte sobre o limite de tamanho de arquivo antes de fixar um valor.
```

**Teste de erro:**
```bash
# Arquivo maior que o limite -> 400 (ajustar caminho do arquivo de teste)
curl -X POST http://localhost:3000/photos ^
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" ^
  -F "albumId=1" ^
  -F "file=@C:\caminho\para\arquivo-grande.jpg"

# Tipo de arquivo não permitido (ex: .pdf) -> 400
curl -X POST http://localhost:3000/photos ^
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" ^
  -F "albumId=1" ^
  -F "file=@C:\caminho\para\documento.pdf"

# Upload válido -> 201, com a foto já acessível pela URL pública retornada
curl -X POST http://localhost:3000/photos ^
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" ^
  -F "albumId=1" ^
  -F "isCover=true" ^
  -F "file=@C:\caminho\para\foto-valida.jpg"
```
(No PowerShell, `Invoke-RestMethod` com multipart tem sintaxe própria —
peço o roteiro em PowerShell quando chegarmos nesse teste, igual fizemos
no roadmap de Auth.)

---

## Dia 4 — Remoção em cascata no R2 (limpeza ao deletar)

```
Dia 4 do roadmap de Upload de Fotos. Dia 3 (upload real) já feito.

Hoje: garantir que remover uma Photo (ou um Album inteiro, que já
remove Photos em cascata via RN010) também apaga o arquivo físico do
bucket R2, não só o registro no banco.

1. PhotosService.remove(id): antes/depois de deletar o registro no
   Prisma, extrair a "key" do objeto a partir da URL salva e chamar
   storageService.deleteFile(key).
2. AlbumsService.remove(id): como a remoção de Album deleta as Photos em
   cascata (RN010, UC029) via Prisma (onDelete: Cascade no schema), isso
   NÃO aciona automaticamente a remoção no R2 (o Prisma só limpa o banco,
   não fala com o bucket). Buscar todas as Photos do álbum ANTES de
   deletar, guardar as keys, deletar o Album (que já casca no banco), e
   só depois disparar a remoção dos arquivos no R2 em paralelo
   (Promise.all).
3. Tratar falha na remoção do R2 sem quebrar a resposta da API (ex: se o
   arquivo já não existir mais no bucket por algum motivo) - logar o erro,
   não lançar exceção pro usuário nesse caso específico, perguntar se
   concorda com essa abordagem antes de implementar.
```

**Teste:**
```bash
# Criar um álbum com 2 fotos, depois remover o álbum, e confirmar no
# painel da Cloudflare R2 que os 2 arquivos físicos sumiram do bucket
# (não só os registros no banco).
```

---

## Dia 5 — Revisão final do bloco de Upload

```
Dia 5 (fechamento do bloco de Upload de Fotos). Dias 0-4 já feitos.

Hoje: revisão geral, sem feature nova.

1. Conferir Swagger (/docs): o endpoint POST /photos deve aparecer
   corretamente como multipart/form-data (não mais JSON), com os campos
   certos documentados.
2. Confirmar RNF009 (otimização de imagens): perguntar se cabe algum
   tratamento de compressão/resize no backend antes do upload pro R2,
   ou se isso fica só a cargo do next/image no front (não decidir
   sozinho, essa é uma escolha de arquitetura).
3. Rodar a bateria de testes dos Dias 3-4 de novo, de ponta a ponta:
   upload válido, upload inválido (tipo/tamanho), remoção de foto avulsa,
   remoção de álbum inteiro com fotos.
4. Confirmar que RN010 (capa única por álbum) continua funcionando junto
   com o fluxo de upload novo.
```

---

## Depois do Upload de Fotos

Retomar o bloco pendente do roadmap geral:
- **Filtros, busca e ordenação nas listagens** (RF008 — relatório de
  escalas; útil também pra listagem pública de Eventos/Comunicados).

Numeração de dias será retomada quando entrarmos nesse bloco.
