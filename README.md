
# Projeto B — Full Cycle

# AgendaFlow API

API REST para gerenciamento de agendamentos, desenvolvida como projeto final da disciplina Full Cycle.

## Objetivo

Permitir a criação e a consulta de agendamentos, validando os dados e evitando reservas conflitantes para o mesmo recurso e horário.

## Tecnologias

- Node.js 24
- TypeScript
- Fastify
- PostgreSQL (a configurar)
- Docker Compose (a configurar)
- Vitest (a configurar)
- GitHub Actions (a configurar)

## Requisitos para desenvolvimento

- Node.js 24
- npm
- Git
- Docker Desktop com Docker Compose

## Executar localmente

Instale as dependências:

npm ci

Inicie o servidor de desenvolvimento:

npm run dev

A API estará disponível em:

http://localhost:3000

## Verificações disponíveis

Verificar tipos:

npm run typecheck

Verificar código:

npm run lint

Compilar:

npm run build

Iniciar a versão compilada:

npm start

## Estado atual

A estrutura inicial da API está funcionando.

O endpoint GET /health retorna:

{"status":"ok"}

As funcionalidades de agendamentos, banco de dados,
testes e CI ainda serão implementadas.

## Organização da equipe

O projeto poderá ser desenvolvido individualmente ou
por dois integrantes, com responsabilidades divididas
entre domínio/persistência e API/infraestrutura.

As alterações serão registradas por commits e
Pull Requests individuais.
