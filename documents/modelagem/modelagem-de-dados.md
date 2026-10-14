# 🗄️ Modelagem de Dados

> Banco real: **PostgreSQL via Prisma** (`schema.prisma` no repositório do back-end).
> O arquivo [`schema_modelagem_mysql.sql`](./schema_modelagem_mysql.sql) é apenas referência para visualização no MySQL Workbench (EER).

## Diagrama (Entidade-Relacionamento)

```mermaid
erDiagram
    CARGOS ||--o{ USUARIOS : "possui"
    CARGOS ||--o{ PERMISSOES : "define"
    PASTORAIS ||--o{ USUARIOS : "coordena (RN006)"
    PASTORAIS ||--o{ VOLUNTARIOS : "reúne"
    USUARIOS ||--o{ COMUNICADOS : "autor"
    USUARIOS ||--o{ LOGS_AUDITORIA : "gera"
    CATEGORIAS ||--o{ EVENTOS : "classifica"
    CATEGORIAS ||--o{ COMUNICADOS : "classifica"
    MISSAS |o--o{ EVENTOS : "correlaciona (RN002)"
    MISSAS ||--o{ ESCALAS : "RN007"
    EVENTOS ||--o{ ESCALAS : "RN007"
    PASTORAIS ||--o{ ESCALAS : "escopo"
    ESCALAS ||--o{ ESCALA_ATRIBUICOES : "contém"
    VOLUNTARIOS ||--o{ ESCALA_ATRIBUICOES : "atribuído"
    EVENTOS ||--o{ CONFIRMACOES_PRESENCA : "recebe"
    EVENTOS |o--o{ ALBUNS : "RN003"
    ALBUNS ||--o{ FOTOS : "RN010"
    MISSAS }o--o{ PASTORAIS : "missa_pastorais (RN017 proposta)"
    EVENTOS }o--o{ PASTORAIS : "evento_pastorais (RN017 proposta)"
```

## Convenções

| Tipo de tabela | ID |
|---|---|
| Sensíveis / não enumeráveis (`usuarios`, `escalas`, `confirmacoes_presenca`, `logs_auditoria`) | UUID |
| Conteúdo simples | Inteiro autoincrement |

## Regras validadas no SERVICE (não no banco)

| Regra | Descrição |
|---|---|
| RN007 | Escala vinculada a Missa **XOR** Evento |
| RN010 | Capa única por Álbum |
| RN017 *(proposta)* | `escalas.pastoral_id` deve estar entre as Pastorais vinculadas à Missa/Evento |

## Fora do MVP (sem tabelas ainda)

- `doacoes`, `campanhas_arrecadacao` (Fase 2)
- Área do fiel/paroquiano (Fase 4)
