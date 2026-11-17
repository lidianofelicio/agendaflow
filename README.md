
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

Para executar a aplicação completa com Docker:

- Git;
- Docker Desktop com Docker Compose.

Para desenvolvimento local e execução dos testes:

- Node.js 24;
- npm.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/lidianofelicio/agendaflow.git
cd agendaflow
```

Para desenvolvimento local, instale as dependências:

```bash
npm ci
```

Esse comando também executa `prisma generate` para gerar o Prisma Client.

Para utilizar somente o Docker Compose, as dependências são instaladas durante a construção da imagem da API.

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

Se o arquivo `.env` já existir e estiver configurado, não o substitua.

O arquivo `.env` contém configurações locais e não deve ser enviado ao GitHub.

Exemplo de configuração local:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=agendaflow_user
DB_PASS=agendaflow_pass
DB_NAME=agendaflow_db

DATABASE_URL="postgresql://agendaflow_user:agendaflow_pass@localhost:5433/agendaflow_db?schema=public"
```

A variável `DATABASE_URL` apresentada acima é utilizada quando a API é executada diretamente no computador.

Dentro do Docker Compose, a API utiliza o endereço interno `agendaflow-db:5432` para acessar o PostgreSQL.

As credenciais acima são valores de exemplo para desenvolvimento local. Não utilize credenciais reais de produção no repositório.

## Executar o AgendaFlow completo com Docker Compose

Esta é a forma principal de iniciar a aplicação completa.

O Docker Compose configura dois serviços:

- `agendaflow-db`: banco de dados PostgreSQL 16;
- `agendaflow-api`: API Fastify com Node.js 24 e Prisma ORM.

Antes de iniciar, configure o arquivo `.env`, conforme a seção anterior.

### Iniciar API e PostgreSQL

Na pasta principal do projeto, execute:

```bash
docker compose up --build -d
```

Esse comando constrói a imagem da API e inicia os serviços em segundo plano.

O Compose aguarda o PostgreSQL ficar saudável antes de iniciar a API.

Durante a inicialização, a API executa:

```bash
npx prisma migrate deploy
```

Esse procedimento aplica migrations pendentes, sem executar uma redefinição do banco.

### Verificar os serviços

Execute:

```bash
docker compose ps
```

O esperado é que os serviços estejam em execução e o PostgreSQL apresente o estado `healthy`.

### Acessar a API

A API estará disponível em:

```text
http://localhost:3000
```

Endpoint de saúde:

```text
http://localhost:3000/health
```

No PowerShell, verifique a resposta:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

### Consultar os logs

Para consultar os últimos registros da API:

```bash
docker compose logs --tail=50 agendaflow-api
```

Para acompanhar os logs em tempo real:

```bash
docker compose logs -f agendaflow-api
```

Para consultar os logs do PostgreSQL:

```bash
docker compose logs --tail=50 agendaflow-db
```

### Interromper os serviços

Para parar a API e o banco de dados sem excluir os dados persistidos:

```bash
docker compose stop
```

Para iniciar novamente os serviços existentes:

```bash
docker compose up -d
```

O volume `agendaflow_pg_data` mantém os dados do PostgreSQL.

**Importante:** não utilize `docker compose down -v`, pois essa opção remove os volumes declarados pelo Compose e pode causar perda dos dados armazenados.

## Executar somente o PostgreSQL com Docker Compose

Para trabalhar com a API diretamente no computador, também é possível iniciar somente o banco.

Inicie apenas o PostgreSQL:

```bash
docker compose up -d agendaflow-db
```

Verifique o serviço:

```bash
docker compose ps
```

O PostgreSQL deve apresentar o estado `healthy` e utilizar a porta externa `5433`, conforme a configuração de exemplo.

O AgendaFlow utiliza os seguintes recursos Docker:

- container: `agendaflow_postgres`;
- rede: `agendaflow_network`;
- volume: `agendaflow_pg_data`;
- porta externa padrão de desenvolvimento: `5433`.

Para interromper somente o PostgreSQL:

```bash
docker compose stop agendaflow-db
```

Não utilize comandos globais de remoção de containers ou volumes.

## Prisma e migrations

Para desenvolvimento local, valide o schema:

```bash
npx prisma validate
```

Gere o Prisma Client:

```bash
npx prisma generate
```

Aplique as migrations ao banco configurado:

```bash
npx prisma migrate deploy
```

Na execução completa com Docker Compose, o comando `prisma migrate deploy` já é executado automaticamente durante a inicialização da API.

## Executar a API localmente

Como alternativa ao container da API, é possível executar o servidor diretamente com Node.js.

Primeiro:

1. configure o arquivo `.env`;
2. inicie o PostgreSQL;
3. instale as dependências;
4. aplique as migrations.

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

**Atenção:** não execute a API local simultaneamente ao container `agendaflow-api` utilizando a mesma porta `3000`.

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

A consulta retorna apenas os agendamentos ativos. Agendamentos cancelados não aparecem.

Os resultados são organizados do horário mais cedo para o mais tarde.

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

Verificações adicionais:

```bash
npm run typecheck
npm run lint
npm run build
```

A configuração do Vitest declara cobertura mínima de 80% para as métricas configuradas.

O projeto utiliza o GitHub Actions para executar verificações automatizadas de qualidade e testes.

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

Arquivos e documentos principais:

- `Dockerfile`: construção da imagem Docker da API;
- `.dockerignore`: arquivos excluídos do contexto de construção;
- `docker-compose.yml`: serviços da API e do PostgreSQL;
- `.env.example`: exemplo das variáveis de ambiente;
- `docs/arquitetura.md`: SOLID e Repository Pattern;
- `docs/adr/0001-persistencia-agendamentos.md`: decisão técnica de persistência;
- `docs/openapi.yaml`: especificação da API;
- `docs/ia.md`: declaração de uso de inteligência artificial;
- `CONTRIBUTORS.md`: contribuições dos integrantes;
- `.github/workflows/ci.yml`: integração contínua.

## Regras de agendamento

- o início deve ser anterior ao término;
- o recurso deve ser informado;
- um recurso não pode possuir períodos sobrepostos;
- recursos diferentes podem utilizar o mesmo horário;
- horários consecutivos não são considerados conflitantes;
- somente agendamentos com status `ACTIVE` bloqueiam o horário;
- a consulta não exibe agendamentos cancelados;
- os resultados da consulta são ordenados por horário inicial.

## Arquitetura e decisões técnicas

O AgendaFlow possui separação entre domínio, aplicação, comunicação HTTP e infraestrutura.

A arquitetura utiliza o **Repository Pattern**, com um contrato de repositório independente da implementação Prisma.

Os princípios SOLID identificados e documentados incluem:

- **SRP — Single Responsibility Principle:** separação das responsabilidades entre casos de uso, rotas HTTP e persistência;
- **DIP — Dependency Inversion Principle:** dependência de abstrações em vez da implementação concreta do banco de dados.

Detalhes disponíveis em:

```text
docs/arquitetura.md
```

A decisão de utilizar PostgreSQL com Prisma ORM está documentada em:

```text
docs/adr/0001-persistencia-agendamentos.md
```

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
- documentação de instalação, execução e uso da API;
- documentação da arquitetura e dos princípios SOLID;
- configuração da execução da API com Docker Compose.

### Junior

- PostgreSQL e Docker Compose inicial;
- Prisma ORM;
- schema e migrations;
- isolamento de container, rede, volume e porta;
- correções resultantes da revisão técnica;
- caso de uso de consulta;
- rota `GET /appointments`;
- filtros por recurso e período;
- retorno do registro completo;
- testes unitários, HTTP e de integração da consulta;
- proteção contra concorrência;
- implementação de logs estruturados, métricas e SLO na branch de observabilidade;
- preparação do smoke test k6;
- revisão técnica dos Pull Requests.

O detalhamento das contribuições está disponível em:

```text
CONTRIBUTORS.md
```

## Fluxo de colaboração

As alterações são realizadas em branches próprias, registradas em commits e revisadas por Pull Requests antes de serem integradas à `main`.

Cada integrante revisa o trabalho do outro antes do merge.

O histórico de commits, comentários, revisões e Pull Requests permanece disponível no GitHub.

O uso de inteligência artificial está declarado em:

```text
docs/ia.md
```

## Estado atual

A criação e a consulta de agendamentos estão integradas ao PostgreSQL e cobertas por testes automatizados.

A API valida os dados recebidos, impede conflitos de horário para o mesmo recurso, permite horários consecutivos e oferece filtros de consulta por recurso e período.

A API e o PostgreSQL podem ser iniciados juntos pelo Docker Compose, com persistência de dados no volume Docker.

Os componentes de observabilidade e desempenho estão sendo tratados na Pull Request específica da equipe, antes da integração definitiva à branch `main`.
