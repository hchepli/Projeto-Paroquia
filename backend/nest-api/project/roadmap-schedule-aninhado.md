# Roadmap — Criação Aninhada de Escala + Atribuições (Schedule + ScheduleAssignment)

Repositório: https://github.com/hchepli/nest-api
Pré-requisito: Auth+RBAC+escopo por pastoral (`roadmap-auth.md`, Dias 0-6) concluído.
Pode ser feito em paralelo ou logo após `roadmap-relatorio-escalas.md` — não há
dependência técnica entre os dois, só compartilham a entidade Schedule.

> **Referência conceitual**: [Aula 27 — Criação de compras com itens aninhados via API](https://github.com/marrcandre/django-drf-tutorial#27-criação-de-compras-com-itens-aninhados-via-api) do tutorial. Lá cria-se uma Compra já com os Itens no mesmo request; aqui o equivalente é criar uma Escala já com as Atribuições (voluntário + função) no mesmo `POST /schedules`, em vez de precisar de um `POST /schedules` seguido de vários `POST /schedule-assignments`.

## Contexto — por que este bloco existe separado

No Dia 5 do `roadmap-backend.md` (DTOs+validação), decidimos deliberadamente
**não** implementar a regra RN007 (Missa XOR Evento) nem a criação aninhada
ainda — ficou só o DTO aceitando os campos soltos, com a lógica de negócio
prometida para depois. Esse "depois" é este roadmap.

Hoje, `POST /schedules` só cria a Escala vazia (sem atribuições) e
`POST /schedule-assignments` cria uma atribuição avulsa apontando para um
`scheduleId` já existente — ou seja, o fluxo do UC020 (Cadastrar Escala) na
prática exige N+1 requests. Este bloco resolve isso.

---

## Dia 1 — DTO aninhado (CreateScheduleDto com array de atribuições)

```
Dia 1 do roadmap de Criação Aninhada de Escala (repo hchepli/nest-api).

Contexto: CreateScheduleDto hoje só tem massId/eventId opcionais (RN007 ainda
não validado). CreateScheduleAssignmentDto existe separado, usado hoje só para
criar atribuição avulsa contra um scheduleId já existente.

Hoje: criar um DTO de atribuição "aninhável" (sem scheduleId, porque o
scheduleId vai ser o da Escala recém-criada, não algo que o cliente informa) e
adicionar um array desse DTO dentro do CreateScheduleDto.

O que fazer:
1. Criar CreateNestedScheduleAssignmentDto (ou nome equivalente): volunteerId
   (@IsInt), funcao/role (@IsString) — igual ao ScheduleAssignmentDto atual,
   MENOS o scheduleId.
2. Em CreateScheduleDto, adicionar campo `assignments` (@IsArray,
   @ValidateNested({ each: true }), @Type(() => CreateNestedScheduleAssignmentDto),
   @ArrayMinSize(0) — permitir escala sem nenhuma atribuição ainda no momento
   da criação, já que dá pra adicionar depois via UC021).
3. Manter massId/eventId como já estão (@IsInt @IsOptional cada) — a
   validação XOR (RN007) fica pro Dia 2, não pro DTO.
4. NÃO mexer no service ainda — só o shape do DTO aceitando o array aninhado.

Gere o CreateScheduleDto atualizado e o novo DTO de atribuição aninhada.
```

**Teste (ainda sem lógica de negócio no service, só validação de shape):**
```bash
# Deve aceitar o shape (ainda sem checar RN007 no service neste dia)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"},{\"volunteerId\":2,\"role\":\"coroinha\"}]}"

# assignment sem volunteerId -> 400 (validação aninhada funcionando)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"assignments\":[{\"role\":\"leitor\"}]}"
```

---

## Dia 2 — Service: RN007 (XOR) + criação transacional das atribuições

```
Dia 2 do roadmap de Criação Aninhada de Escala. Dia 1 (DTO aninhado) já feito.

Hoje: a lógica de negócio de verdade no SchedulesService.create.

Pontos críticos:
1. RN007: validar que massId XOR eventId (exatamente um dos dois preenchido,
   nunca os dois, nunca nenhum) — se violar, lançar BadRequestException com
   mensagem clara ANTES de tentar criar qualquer coisa no banco.
2. Criação em TRANSAÇÃO (this.prisma.$transaction): criar a Schedule e, no
   mesmo bloco, criar todas as ScheduleAssignments do array `assignments`
   vinculadas ao id da Schedule recém-criada. Se qualquer atribuição falhar
   (ex: volunteerId inexistente -> P2003 foreign key), a Schedule também não
   deve ser criada (rollback).
3. Duplicidade dentro do mesmo request (já é regra do UC021, mas cabe aqui
   também): se o array `assignments` tiver o mesmo volunteerId + role
   repetido duas vezes, rejeitar com 400 ANTES de abrir a transação (evita
   depender só da constraint UNIQUE do banco pra dar um erro genérico).
4. pastoralId da Schedule (usado no escopo RN006/RN008): confirmar comigo se
   deve ser preenchido automaticamente a partir do usuário logado (se for
   Coordenador de Pastoral) ou se continua sendo passado manualmente no DTO
   — isso não ficou fechado nos roadmaps anteriores, não decidir sozinho.

Me pergunte sobre o ponto 4 antes de implementar.
```

**Teste:**
```bash
# massId e eventId juntos -> 400 (RN007)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"eventId\":1,\"assignments\":[]}"

# nenhum dos dois -> 400 (RN007)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"}]}"

# mesmo voluntário + mesma função duas vezes no array -> 400 (duplicidade)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"},{\"volunteerId\":1,\"role\":\"leitor\"}]}"

# válido, com 2 atribuições -> 201, Schedule + as 2 assignments criadas juntas
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"},{\"volunteerId\":2,\"role\":\"coroinha\"}]}"

# volunteerId inexistente -> toda a operação falha (nem a Schedule fica criada) — conferir com GET depois
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" -d "{\"massId\":1,\"assignments\":[{\"volunteerId\":9999,\"role\":\"leitor\"}]}"
```

---

## Dia 3 — Escopo por pastoral na criação (RN006 + RN017)

> **Decisão de modelagem tomada** (substitui o ponto em aberto original deste
> Dia 3): Mass e Event passam a ter uma relação **N:N com PastoralGroup**
> (tabelas `missa_pastorais` / `evento_pastorais` no `.sql` de referência —
> **ainda precisam ser criadas no `schema.prisma` real e migradas**, isso é
> pré-requisito deste dia). Ou seja, ao cadastrar uma Missa/Evento (UC011/UC015),
> a Secretaria/Admin Geral seleciona quais Pastorais participam dela. Um
> Coordenador de Pastoral só pode criar Escala para uma Missa/Evento se a
> pastoral dele estiver nesse conjunto (**RN017**, proposta pendente de
> incorporação formal ao documento de Regras de Negócio).

```
Dia 3 do roadmap de Criação Aninhada de Escala. Dia 2 (RN007 + transação) já
feito.

Pré-requisito deste dia (fazer ANTES, se ainda não estiver feito): adicionar
ao schema.prisma os models de junção equivalentes a missa_pastorais e
evento_pastorais (N:N entre Mass/Event e PastoralGroup — ver .sql de
referência atualizado), rodar a migration, e regenerar o client. Confirme
comigo os nomes dos models (sugestão: MassPastoralGroup / EventPastoralGroup)
antes de gerar a migration, para manter o padrão de nomenclatura já usado
no projeto.

Hoje: aplicar RN006/RN017 na CRIAÇÃO de Escala (não só na listagem/relatório,
que já foi feito no Dia 6 do roadmap de Auth).

1. No SchedulesService.create, se o usuário logado for Coordenador de
   Pastoral: buscar as pastorais vinculadas à Mass/Event informado
   (via a nova tabela de junção) e validar que a pastoral do usuário está
   nesse conjunto — bloquear com 403 Forbidden se não estiver.
2. Se a Mass/Event não tiver NENHUMA pastoral vinculada, nenhum Coordenador
   consegue criar Escala nela (só Admin Geral/Secretaria) — comportamento já
   assumido como correto, mas cabe um teste explícito disso.
3. Validar também a consistência do campo escalas.pastoral_id: ele deve estar
   contido no conjunto de pastorais vinculadas à Mass/Event da própria
   Escala (não só bater com o usuário logado, mas o dado em si precisa ser
   coerente, já que Admin Geral/Secretaria podem opcionalmente informar um
   pastoral_id na criação).
4. Reaproveitar o mesmo guard/lógica de escopo já usado no findAll (Dia 6 do
   roadmap de Auth) para a parte de "é Coordenador? qual pastoral?" — só a
   fonte da lista de pastorais da Mass/Event é nova (a tabela de junção).

Gere o SchedulesService.create atualizado e, se ainda não existir, os
endpoints simples para vincular/desvincular Pastorais em Mass/Event
(ex: dentro do próprio CreateMassDto/CreateEventDto como array de
pastoralGroupIds, ou endpoints dedicados — sugerir as duas opções e me
perguntar qual prefiro antes de fixar).
```

**Teste:**
```bash
# Coordenador tentando criar escala para Missa sem sua pastoral vinculada -> 403
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_COORDENADOR" \
  -d "{\"massId\":1,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"}]}"

# Coordenador criando para Missa com sua pastoral vinculada -> 201
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_COORDENADOR" \
  -d "{\"massId\":2,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"}]}"

# Missa sem nenhuma pastoral vinculada -> Coordenador bloqueado (403),
# mas Admin Geral/Secretaria conseguem criar normalmente (200/201)
curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_COORDENADOR" \
  -d "{\"massId\":3,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"}]}"

curl -X POST http://localhost:3000/schedules -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d "{\"massId\":3,\"assignments\":[{\"volunteerId\":1,\"role\":\"leitor\"}]}"
```

---

## Dia 4 — Revisão final do bloco

```
Dia 4 (fechamento do bloco de Criação Aninhada). Dias 1-3 já feitos.

Hoje: revisão geral, sem feature nova.

1. Conferir Swagger (/docs): POST /schedules deve mostrar o array `assignments`
   aninhado corretamente no schema do body.
2. Conferir se UC021 (Editar Escala — adicionar/remover atribuições depois de
   criada) continua funcionando sem conflito com a criação aninhada nova
   (são fluxos diferentes: criação aninhada no POST, edição incremental no
   PATCH/endpoints de assignment).
3. Rodar de novo a bateria de testes dos Dias 1-3, simulando os 3 cargos.
4. Marcar como CONCLUÍDO no `roadmap-backend.md` o item "Schedule +
   ScheduleAssignment (criação aninhada)" da tabela de prévia.
```

---

## Depois deste bloco

Com este roadmap e o `roadmap-relatorio-escalas.md` concluídos, todos os
blocos listados na tabela "Prévia" do `roadmap-backend.md` estarão
finalizados. Próximos passos ficam a critério do projeto geral: testes
automatizados (RNF019), CI/CD, deploy (Hostinger, fora de escopo até agora),
ou início do front-end do admin consumindo esta API.
