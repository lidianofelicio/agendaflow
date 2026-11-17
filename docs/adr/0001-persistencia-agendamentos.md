# ADR 0001 — Persistência de Agendamentos com PostgreSQL e Prisma

**Status:** Aceita  
**Projeto:** AgendaFlow — Projeto B  
**Data:** 16/11/2026

## 1. Contexto

O AgendaFlow é uma API REST desenvolvida com Node.js, TypeScript e Fastify para criação e consulta de agendamentos.

O sistema precisa armazenar os agendamentos de forma persistente, validar os períodos informados e evitar conflitos de horário para um mesmo recurso.

É necessário garantir que os dados permaneçam disponíveis após o reinício da aplicação, além de facilitar sua manutenção e evolução.

## 2. Decisão

Foi adotado o **PostgreSQL 16** como banco de dados relacional, utilizando o **Prisma ORM 5** como ferramenta de acesso aos dados.

A aplicação utiliza o Prisma para realizar operações de persistência, consultar registros e administrar a evolução do banco por meio de migrations.

O PostgreSQL é executado em um container Docker, configurado pelo Docker Compose.

## 3. Justificativa

A escolha foi fundamentada nos seguintes fatores:

- **Persistência:** os agendamentos permanecem armazenados após o encerramento da aplicação.
- **Integridade:** o PostgreSQL oferece transações e restrições para proteger a consistência dos dados.
- **Produtividade:** o Prisma simplifica as consultas e fornece integração tipada com TypeScript.
- **Manutenção:** as migrations permitem controlar alterações na estrutura do banco.
- **Reprodutibilidade:** o Docker Compose facilita a configuração do ambiente de desenvolvimento.

## 4. Alternativas consideradas

### Armazenamento em memória

Foi considerada a utilização de uma lista em memória para armazenar os agendamentos.

**Vantagens:**
- Implementação simples.
- Não exige banco de dados externo.
- Facilita protótipos e testes iniciais.

**Desvantagens:**
- Os dados são perdidos quando a aplicação é reiniciada.
- Não oferece persistência adequada para a utilização real.
- Dificulta a garantia de integridade em operações concorrentes.

**Decisão:** alternativa descartada por não atender às necessidades de persistência do sistema.

## 5. Consequências

### Positivas

- Armazenamento persistente de agendamentos.
- Maior confiabilidade na manutenção dos dados.
- Separação entre regras de negócio e infraestrutura.
- Facilidade para reproduzir o ambiente utilizando Docker.
- Possibilidade de implementar proteções adicionais de integridade no banco.

### Negativas

- Necessidade de configurar e manter o PostgreSQL.
- Dependência do Prisma ORM.
- Necessidade de executar migrations durante a implantação.
- Maior complexidade operacional em comparação ao armazenamento em memória.

## 6. Conclusão

A utilização do PostgreSQL com Prisma ORM atende às necessidades do AgendaFlow e oferece uma base consistente para o gerenciamento de agendamentos.

A decisão prioriza integridade, persistência, organização do código e facilidade de manutenção, mantendo o escopo adequado ao Projeto B.