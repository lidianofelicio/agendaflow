# Projeto B — Full Cycle

# AgendaFlow API

API REST para criação e consulta de agendamentos, com validação de dados, prevenção de conflitos de horário e persistência em PostgreSQL.

## Tecnologias

- Node.js 24
- TypeScript
- Fastify
- PostgreSQL 16
- Prisma ORM 5
- Docker Compose
- Vitest
- ESLint

## Funcionalidades implementadas

- verificação de saúde da API;
- criação de agendamentos;
- consulta de agendamentos;
- filtros por recurso e período;
- validação de recurso, data inicial e data final;
- rejeição de períodos inválidos;
- prevenção de conflito para o mesmo recurso;
- persistência no PostgreSQL;
- migrations com Prisma;
- testes unitários;
- testes da camada HTTP;
- testes de integração com PostgreSQL.

## Requisitos

- Node.js 24
- npm
- Git
- Docker Desktop com Docker Compose

## Instalação

Clone o repositório:

```bash
git clone https://github.com/lidianofelicio/agendaflow.git
cd agendaflow
```

Instale as dependências:

```bash
npm ci
```

O comando também executa `prisma generate` para gerar o Prisma Client.

## Variáveis de ambiente

O projeto fornece o arquivo `.env.example`.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

O arquivo `.env` contém configurações locais e não deve ser enviado ao GitHub.

Variáveis utilizadas:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=agendaflow_user
DB_PASS=agendaflow_pass
DB_NAME=agendaflow_db

DATABASE_URL="postgresql://agendaflow_user:agendaflow_pass@localhost:5433/agendaflow_db?schema=public"
```

## PostgreSQL com Docker Compose

Inicie somente o banco do AgendaFlow:

```bash
docker compose up -d
```

Verifique o estado:

```bash
docker compose ps
```

O serviço deve aparecer como `healthy` na porta `5433`.

O AgendaFlow utiliza recursos Docker exclusivos:

- container: `agendaflow_postgres`;
- rede: `agendaflow_network`;
- volume: `agendaflow_pg_data`;
- porta externa: `5433`.

Para parar somente o banco do AgendaFlow:

```bash
docker compose stop
```

Não utilize comandos globais de remoção de containers ou volumes.

## Prisma e migrations

Valide o schema:

```bash
npx prisma validate
```

Gere o Prisma Client:

```bash
npx prisma generate
```

Aplique as migrations:

```bash
npx prisma migrate deploy
```

## Executar a API

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A API estará disponível em:

```text
http://localhost:3000
```

Para compilar e iniciar a versão compilada:

```bash
npm run build
npm start
```

## Endpoints

### Verificar a API

```http
GET /health
```

Resposta `200 OK`:

```json
{
  "status": "ok"
}
```

### Criar um agendamento

```http
POST /appointments
Content-Type: application/json
```

Corpo da requisição:

```json
{
  "resourceId": "sala-1",
  "startsAt": "2026-12-10T10:00:00.000Z",
  "endsAt": "2026-12-10T11:00:00.000Z"
}
```

As datas devem ser enviadas no padrão ISO 8601 em UTC.

Resposta `201 Created`:

```json
{
  "resourceId": "sala-1",
  "startsAt": "2026-12-10T10:00:00.000Z",
  "endsAt": "2026-12-10T11:00:00.000Z"
}
```

Resposta `400 Bad Request` para dados ou períodos inválidos:

```json
{
  "error": "INVALID_APPOINTMENT_PERIOD",
  "message": "Appointment start must be before its end"
}
```

Resposta `409 Conflict` quando o recurso já possui um agendamento no período:

```json
{
  "error": "APPOINTMENT_CONFLICT",
  "message": "The resource already has an appointment during this period"
}
```

Horários consecutivos são permitidos. Por exemplo, um agendamento pode terminar às 11h e outro começar exatamente às 11h.

### Consultar agendamentos

```http
GET /appointments
```

A consulta retorna apenas os agendamentos ativos. Agendamentos cancelados não aparecem. Os resultados são organizados do horário mais cedo para o mais tarde.

Resposta `200 OK`:

```json
[
  {
    "id": "4c2f2757-7967-49cb-81f4-f71752f33925",
    "resourceId": "sala-1",
    "startsAt": "2026-12-10T10:00:00.000Z",
    "endsAt": "2026-12-10T11:00:00.000Z",
    "status": "ACTIVE",
    "createdAt": "2026-11-16T20:00:00.000Z",
    "updatedAt": "2026-11-16T20:00:00.000Z"
  }
]
```

Quando não existem registros, a API retorna:

```json
[]
```

#### Filtros opcionais

A rota aceita os seguintes parâmetros de consulta:

- `resourceId`: filtra pelo recurso;
- `startsAt`: início da janela de consulta no padrão ISO 8601;
- `endsAt`: término da janela de consulta no padrão ISO 8601.

Exemplo:

```http
GET /appointments?resourceId=sala-1&startsAt=2026-12-10T09:00:00.000Z&endsAt=2026-12-10T12:00:00.000Z
```

Resposta `400 Bad Request` para filtros inválidos:

```json
{
  "error": "INVALID_APPOINTMENT_QUERY",
  "message": "startsAt must be before endsAt"
}
```

## Testes e verificações

Testes unitários e da camada HTTP:

```bash
npm test
```

Testes de integração com PostgreSQL:

```bash
npm run test:integration
```

Antes dos testes de integração:

1. configure o `.env`;
2. inicie o PostgreSQL;
3. aplique as migrations.

Outras verificações:

```bash
npm run typecheck
npm run lint
npm run build
```

## Estrutura principal

```text
src/
├── application/     # casos de uso e contratos
├── domain/          # regras de agendamento
├── http/            # rotas Fastify
├── infra/           # Prisma e persistência
├── app.ts           # configuração da aplicação
└── server.ts        # inicialização do servidor
```

## Regras de agendamento

- o início deve ser anterior ao término;
- o recurso deve ser informado;
- um recurso não pode possuir períodos sobrepostos;
- recursos diferentes podem utilizar o mesmo horário;
- horários consecutivos não são considerados conflitantes;
- somente agendamentos com status `ACTIVE` bloqueiam o horário;
- a consulta não exibe agendamentos cancelados;
- os resultados da consulta são ordenados por horário inicial.

## Organização da equipe

### Lidiano

- estrutura inicial do projeto;
- configuração de Node.js, TypeScript e Fastify;
- domínio e validações;
- regra de conflito;
- caso de uso de criação;
- rota `POST /appointments`;
- integração da API com o Prisma;
- testes unitários, HTTP e de integração;
- ampliação dos cenários de conflito;
- documentação de instalação, execução e uso da API.

### Júnior

- PostgreSQL e Docker Compose;
- Prisma ORM;
- schema e migrations;
- isolamento de container, rede, volume e porta;
- correções resultantes da revisão técnica;
- caso de uso de consulta;
- rota `GET /appointments`;
- filtros por recurso e período;
- retorno do registro completo;
- testes unitários, HTTP e de integração da consulta;
- revisão técnica dos Pull Requests.

## Fluxo de colaboração

As alterações são realizadas em branches próprias, registradas em commits e revisadas por Pull Requests antes de serem integradas à `main`.

Cada integrante revisa o trabalho do outro antes do merge. O histórico de commits, comentários, revisões e Pull Requests permanece disponível no GitHub.

## Estado atual

A criação e a consulta de agendamentos estão integradas ao PostgreSQL e cobertas por testes automatizados.

A API valida os dados recebidos, impede conflitos de horário para o mesmo recurso, permite horários consecutivos e oferece filtros de consulta por recurso e período.