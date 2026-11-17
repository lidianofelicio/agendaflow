
# CONTRIBUTORS — AgendaFlow

**Projeto:** AgendaFlow API  
**Nível:** Projeto B — Full Cycle  
**Equipe:** Lidiano e Junior

## 1. Objetivo

Este documento registra as contribuições individuais dos integrantes do projeto AgendaFlow, conforme os requisitos de avaliação do Projeto B.

O desenvolvimento foi organizado em branches, commits e Pull Requests no GitHub, permitindo identificar as responsabilidades de cada integrante.

## 2. Lidiano — lidianofelicio

Responsável pelas seguintes atividades:

- Estrutura inicial do projeto Node.js e TypeScript.
- Configuração do Fastify.
- Implementação do domínio de agendamentos.
- Validação de datas e períodos.
- Regras de prevenção de conflitos.
- Caso de uso de criação de agendamentos.
- Implementação da rota POST /appointments.
- Integração da aplicação com Prisma.
- Testes unitários e da camada HTTP.
- Ampliação dos testes de conflito.
- Documentação de instalação e utilização no README.
- Configuração da CI com GitHub Actions.
- Configuração da cobertura mínima de testes.
- Elaboração do ADR de persistência.
- Documentação OpenAPI.
- Revisão e validação da proteção de concorrência.

## 3. Junior — devjuniordepaula

Responsável pelas seguintes atividades:

- Configuração do PostgreSQL com Docker Compose.
- Configuração do Prisma ORM.
- Criação do schema e das migrations.
- Organização e isolamento dos recursos Docker.
- Implementação da consulta de agendamentos.
- Implementação da rota GET /appointments.
- Filtros por recurso e período.
- Testes da consulta de agendamentos.
- Implementação da proteção contra concorrência.
- Criação de constraint de exclusão no PostgreSQL.
- Utilização de transações Serializable.
- Tratamento de conflitos concorrentes.
- Testes de integração com requisições simultâneas.
- Revisão técnica das Pull Requests.

## 4. Colaboração e revisão

O projeto utiliza Git e GitHub para controle de versões.

As implementações são desenvolvidas em branches separadas e integradas à branch main por meio de Pull Requests.

Os integrantes participam das revisões técnicas e verificações de qualidade antes da integração.

## 5. Evidências

Repositório:
https://github.com/lidianofelicio/agendaflow

As contribuições podem ser verificadas no histórico de commits, nas Pull Requests e nas respectivas revisões.

## 6. Considerações finais

O AgendaFlow foi desenvolvido colaborativamente, com divisão de responsabilidades e aplicação de práticas de engenharia de software.

Este documento complementa o histórico do GitHub e identifica as contribuições individuais para avaliação acadêmica.
