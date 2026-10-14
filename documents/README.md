# 📚 Documentação do Projeto

Central de documentação do **Sistema Paroquial**. Em caso de conflito entre documentos, vale a ordem: **Requisitos e Regras de Negócio** › Casos de Uso › Modelagem.

## 🗂️ Estrutura

```
documents/
├── requisitos/
│   ├── requisitos-funcionais.md        # RF001–RF024
│   ├── requisitos-nao-funcionais.md    # RNF001–RNF020
│   └── regras-de-negocio.md            # RN001–RN017
├── casos-de-uso/
│   └── casos-de-uso.md                 # UC001–UC037
├── modelagem/
│   ├── modelagem-de-dados.md           # Diagrama ER + convenções
│   └── schema_modelagem_mysql.sql      # Referência para MySQL Workbench
├── frontend/                           # Docs específicos do Next.js
└── backend/                            # Docs específicos do NestJS
```

## 🔗 Atalhos

| Documento | O que contém |
|---|---|
| [Requisitos Funcionais](./requisitos/requisitos-funcionais.md) | O que o sistema faz |
| [Requisitos Não Funcionais](./requisitos/requisitos-nao-funcionais.md) | Segurança, desempenho, qualidade |
| [Regras de Negócio](./requisitos/regras-de-negocio.md) | Políticas e restrições |
| [Casos de Uso](./casos-de-uso/casos-de-uso.md) | Fluxos passo a passo por módulo |
| [Modelagem de Dados](./modelagem/modelagem-de-dados.md) | Entidades e relacionamentos |
| [Roadmaps](./roadmaps/README.md) | Ordem de desenvolvimento |
