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

As migrations criam a tabela `appointments` e impedem que `startsAt` seja igual ou posterior a `endsAt`.

## Executar a API

Modo de desenvolvimento:

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
- somente agendamentos com status `ACTIVE` bloqueiam o horário.

## Organização da equipe

### Lidiano

- estrutura inicial do projeto;
- domínio e validações;
- regra de conflito;
- caso de uso de criação;
- rota `POST /appointments`;
- integração da API com o Prisma;
- testes unitários, HTTP e de integração.

### Júnior

- PostgreSQL e Docker Compose;
- Prisma ORM;
- schema e migrations;
- isolamento de container, rede, volume e porta;
- revisão técnica dos Pull Requests;
- consulta de agendamentos em desenvolvimento.

## Fluxo de colaboração

As alterações são realizadas em branches próprias, registradas em commits e revisadas por Pull Requests antes de serem integradas à `main`.

## Estado atual

A criação de agendamentos está integrada ao PostgreSQL e testada.

A consulta de agendamentos será adicionada em um Pull Request separado.