
# Uso de Inteligência Artificial — AgendaFlow

**Projeto:** AgendaFlow API  
**Nível:** Projeto B — Full Cycle  
**Equipe:** Lidiano e Junior  
**Data:** 16/11/2026

## 1. Objetivo

Este documento registra a utilização de inteligência artificial como ferramenta de apoio ao desenvolvimento do AgendaFlow, conforme as orientações do professor.

A IA foi utilizada para auxiliar na organização das atividades, compreensão de conceitos técnicos, análise de alternativas, elaboração de documentação e preparação de verificações.

As decisões técnicas, a execução dos comandos, a revisão do código e a validação dos resultados permaneceram sob responsabilidade dos integrantes da equipe.

## 2. Ferramenta utilizada

O ChatGPT foi utilizado como ferramenta de apoio durante o desenvolvimento do projeto.

A ferramenta auxiliou na explicação de conceitos, elaboração de exemplos, orientação de procedimentos e organização da documentação.

## 3. Principais aplicações

### Planejamento e organização

A IA auxiliou na interpretação dos requisitos do Projeto B, organização da checklist de entregas e definição da sequência das atividades.

### Desenvolvimento e arquitetura

Foi utilizada como apoio para compreender conceitos de TypeScript, Fastify, PostgreSQL, Prisma, Docker Compose e organização das camadas da aplicação.

Também auxiliou na análise de decisões arquiteturais e na identificação de alternativas.

### Testes e qualidade

A IA auxiliou na orientação para execução e interpretação de verificações como:

- npm run typecheck
- npm run lint
- npm run build
- npm test
- npm run test:integration
- npx vitest run --coverage

Os resultados foram obtidos por meio da execução local e conferidos pela equipe.

### Documentação

A IA auxiliou na elaboração e revisão dos seguintes documentos:

- README.md
- docs/adr/0001-persistencia-agendamentos.md
- docs/openapi.yaml
- CONTRIBUTORS.md
- docs/ia.md

Também foi utilizada como apoio para identificar e corrigir avisos de validação da documentação OpenAPI.

## 4. Exemplos de prompts relevantes

Os exemplos abaixo representam as solicitações utilizadas durante o desenvolvimento.

### Prompt 1 — Requisitos

"Analise os requisitos do professor para o Projeto B e organize uma checklist com os itens obrigatórios, evitando funcionalidades extras."

### Prompt 2 — Arquitetura

"Ajude a documentar a decisão de utilizar PostgreSQL com Prisma ORM no AgendaFlow, apresentando justificativas, alternativas descartadas e consequências."

### Prompt 3 — Testes

"Explique como configurar a cobertura mínima de testes no Vitest e interpretar os resultados obtidos no terminal."

### Prompt 4 — OpenAPI

"Prepare a documentação OpenAPI dos endpoints existentes no AgendaFlow, respeitando as requisições e respostas implementadas."

### Prompt 5 — GitHub Actions

"Oriente a configuração de integração contínua com instalação das dependências, lint e testes automatizados no GitHub Actions."

### Prompt 6 — Revisão

"Ajude a analisar os resultados dos testes de integração da proteção contra concorrência e verificar se a Pull Request está pronta para aprovação."

## 5. Critérios de validação

As sugestões produzidas pela IA não foram consideradas automaticamente corretas.

As implementações e documentações foram verificadas por meio de:

- Inspeção dos arquivos do projeto.
- Execução dos comandos no ambiente local.
- Testes automatizados e de integração.
- Validação da especificação OpenAPI.
- Revisões por Pull Requests no GitHub.

## 6. Responsabilidade da equipe

A inteligência artificial foi utilizada exclusivamente como ferramenta de apoio.

Lidiano e Junior permaneceram responsáveis pelas decisões técnicas, implementação, validação, interpretação dos resultados e entrega do projeto.

O uso de IA não substituiu a necessidade de compreender o código desenvolvido ou demonstrar o funcionamento do sistema.

## 7. Conclusão

O uso de inteligência artificial contribuiu para a organização, documentação e revisão técnica do AgendaFlow.

A ferramenta foi utilizada de maneira complementar, com verificações práticas e responsabilidade dos integrantes sobre o resultado final.
