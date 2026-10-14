# Roadmap — Ações Personalizadas: Exportação do Relatório de Escalas (RF008/UC023)

Repositório: https://github.com/hchepli/nest-api
Pré-requisito: Roadmap de Filtros/Busca/Ordenação (`roadmap-filtros-paginacao.md`) concluído — Dias 0-5.

> **Referência conceitual**: [Aula 35b — Ações personalizadas em coleções e relatório de vendas do mês](https://github.com/marrcandre/django-drf-tutorial#35b-ações-personalizadas-em-coleções-e-relatório-de-vendas-do-mês) do tutorial. Lá é uma `@action` do DRF para relatório de vendas; no Nest o equivalente é um endpoint dedicado (`GET /schedules/report/export`) que reaproveita a mesma lógica de filtro/escopo do `SchedulesService.findAll`, só que sem paginação (retorna o conjunto completo filtrado) e com um `Content-Type` diferente no final (CSV ou PDF).

Este é o último bloco do roadmap geral de back-end do MVP. Ao final dele, o RF008/UC023 estará completo: filtro, paginação (já feito) e exportação.

## Ponto em aberto antes de começar

Ainda não decidimos **qual biblioteca de PDF** vamos usar (ex: `pdfkit`, `puppeteer`, `@react-pdf/renderer`). Cada dia abaixo que tocar em PDF vai te perguntar antes de fixar — não vou escolher sozinho.

---

## Dia 1 — Endpoint de exportação em CSV

```
Dia 1 do roadmap de Exportação do Relatório de Escalas (repo hchepli/nest-api).
Pré-requisito: roadmap de Filtros/Paginação concluído — SchedulesService.findAll já
aceita paginação, busca, ordenação e já respeita o escopo por pastoral (RN006/RN008).

Hoje: exportação em CSV, sem PDF ainda.

O que fazer:
1. Instalar uma lib simples de geração de CSV (sugerir `json2csv` ou montar CSV
   manualmente com poucas colunas — me perguntar qual preferência antes de instalar
   dependência nova).
2. Criar SchedulesService.findAllForExport(filters, user): reaproveita a MESMA lógica
   de filtro (período, massId, eventId, volunteerId) e de escopo por pastoral
   (RN006/RN008) do findAll já existente, mas SEM paginação (skip/take) — retorna
   o array completo do resultado filtrado.
3. Criar endpoint GET /schedules/report/export?format=csv (aceitando os mesmos
   query params de filtro do relatório já existente).
4. Response: Content-Type: text/csv, Content-Disposition: attachment;
   filename="relatorio-escalas.csv". Colunas sugeridas: data (da Missa/Evento
   vinculado), tipo (Missa/Evento), título, pastoral, voluntário, função. Confirmar
   comigo se essas colunas cobrem o que a Secretaria precisa antes de fixar.
5. Aplicar @Roles nas mesmas regras já usadas no findAll normal (Admin Geral,
   Secretaria, Coordenador de Pastoral — este último só vê a própria pastoral,
   igual já acontece hoje).

Me pergunte sobre a lib de CSV antes de instalar.
```

**Teste:**
```bash
# Admin Geral, exportação completa
curl "http://localhost:3000/schedules/report/export?format=csv" \
  -H "Authorization: Bearer TOKEN_ADMIN" -o relatorio-admin.csv
# Conferir que o arquivo baixado abre certo no Excel/Sheets, com todas as escalas

# Coordenador de Pastoral, exportação -> só as da própria pastoral
curl "http://localhost:3000/schedules/report/export?format=csv" \
  -H "Authorization: Bearer TOKEN_COORDENADOR" -o relatorio-coordenador.csv
# Conferir que NÃO aparecem escalas de outra pastoral no CSV

# Com filtro de período combinado
curl "http://localhost:3000/schedules/report/export?format=csv&startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer TOKEN_ADMIN" -o relatorio-janeiro.csv
```

---

## Dia 2 — Exportação em PDF

```
Dia 2 do roadmap de Exportação do Relatório de Escalas. Dia 1 (CSV) já feito.

Hoje: o mesmo relatório, mas em PDF.

Antes de tudo: preciso que você me pergunte qual biblioteca usar
(pdfkit — mais simples e leve, monta o PDF "na mão" elemento por elemento;
puppeteer — renderiza HTML/CSS e gera PDF a partir disso, mais flexível
visualmente mas mais pesado como dependência; @react-pdf/renderer — se
quisermos componentizar como React). NÃO decidir sozinho.

Depois de eu confirmar a lib:
1. Instalar a biblioteca escolhida.
2. Reaproveitar o MESMO SchedulesService.findAllForExport(filters, user) do Dia 1
   (não duplicar a lógica de filtro/escopo).
3. Adicionar suporte a ?format=pdf no mesmo endpoint GET /schedules/report/export
   (ou endpoint separado, se a lib escolhida pedir isso — perguntar se preferir
   separar antes de decidir).
4. Layout simples: cabeçalho com nome da paróquia + período do filtro aplicado,
   tabela com as mesmas colunas do CSV (data, tipo, título, pastoral, voluntário,
   função), rodapé com data de geração do relatório.
5. Response: Content-Type: application/pdf, Content-Disposition: attachment.

Gere os arquivos necessários.
```

**Teste:**
```bash
curl "http://localhost:3000/schedules/report/export?format=pdf" \
  -H "Authorization: Bearer TOKEN_ADMIN" -o relatorio-admin.pdf
# Abrir o PDF e conferir layout, colunas e se o filtro de período (se usado)
# aparece indicado no cabeçalho

curl "http://localhost:3000/schedules/report/export?format=xml" \
  -H "Authorization: Bearer TOKEN_ADMIN"
# format inválido -> 400 com mensagem clara (só csv/pdf são aceitos)
```

---

## Dia 3 — Revisão final do bloco (fechamento do roadmap geral de back-end MVP)

```
Dia 3 (fechamento do bloco de Exportação, e também fechamento do roadmap geral
de back-end do MVP). Dias 1-2 já feitos.

Hoje: revisão geral, sem feature nova.

1. Conferir Swagger (/docs): o endpoint de exportação deve aparecer documentado,
   incluindo o parâmetro format e os filtros herdados do relatório (período,
   massId, eventId, volunteerId).
2. Rodar a bateria de regressão completa dos blocos anteriores (Auth, Upload de
   Fotos, Filtros/Paginação) mais uma vez, igual fizemos no Dia 0 do roadmap de
   Filtros/Paginação — garantir que nada quebrou com a adição da exportação.
3. Conferir especificamente:
   - Coordenador de Pastoral não consegue exportar dados de outra pastoral,
     nem manipulando os query params manualmente.
   - CSV e PDF batem com os dados retornados pela listagem paginada normal
     (mesmos filtros, mesmo resultado, só formato de saída diferente).
4. Marcar RF008/UC023 como CONCLUÍDO no controle de requisitos.
```

---

## Depois deste bloco

Com este roadmap concluído, o **MVP de back-end (RF001-RF019, RF023, excluindo
RF020-022/RF024 que são Fase 2/Fase 4) está com toda a base de API pronta**:
DTOs+validação, Auth+RBAC+escopo por pastoral, Upload de fotos, Filtros/Paginação
e Exportação de relatórios.

Ainda em aberto no `roadmap-backend.md` (tabela "Prévia"), fora deste bloco:
- **Criação aninhada de Schedule + ScheduleAssignment** — roadmap próprio:
  `roadmap-schedule-aninhado.md`.

Itens de infraestrutura/produto ainda não roadmapizados (fora do escopo de
back-end puro): deploy/hospedagem (Hostinger, mencionado no contexto), CI/CD,
testes automatizados (RNF019) de ponta a ponta.
