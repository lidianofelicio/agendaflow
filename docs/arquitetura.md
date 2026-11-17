
# Arquitetura, SOLID e Design Pattern — AgendaFlow

**Projeto:** AgendaFlow API  
**Modalidade:** Projeto B — Full Cycle  
**Data:** 16/11/2026

## 1. Objetivo

Este documento apresenta a organização arquitetural do AgendaFlow, os princípios SOLID identificados no código e o padrão de projeto utilizado.

O objetivo é justificar as decisões técnicas adotadas, demonstrando como elas contribuem para a separação de responsabilidades, a manutenção e a testabilidade da aplicação.

## 2. Visão geral da arquitetura

O AgendaFlow é uma API REST desenvolvida com Node.js, TypeScript e Fastify, utilizando PostgreSQL para persistência e Prisma ORM para acesso aos dados.

O código está organizado em camadas:

- **Domain:** regras de negócio relacionadas aos agendamentos.
- **Application:** casos de uso e contratos de persistência.
- **HTTP:** rotas, validação das entradas e respostas da API.
- **Infra:** implementação do acesso ao banco de dados.

Essa organização separa as regras de negócio dos detalhes de comunicação HTTP e persistência.

### Fluxo de uma requisição

1. O cliente envia uma requisição HTTP.
2. A rota Fastify recebe e interpreta os dados.
3. O caso de uso executa as validações e regras aplicáveis.
4. O repositório realiza as operações de persistência ou consulta.
5. A rota retorna a resposta HTTP correspondente.

## 3. Padrão de projeto: Repository Pattern

O principal padrão de projeto identificado no AgendaFlow é o **Repository Pattern**.

Esse padrão cria uma abstração para o acesso aos dados, permitindo que os casos de uso trabalhem com um contrato sem depender diretamente da tecnologia de persistência.

### 3.1. Contrato

Arquivo:

`src/application/appointments/appointment-repository.ts`

A interface `AppointmentRepository` define operações como:

- `findByResourceId()`: busca agendamentos de um recurso.
- `create()`: registra um agendamento.
- `list()`: consulta agendamentos com filtros opcionais.

### 3.2. Implementação

Arquivo:

`src/infra/repositories/prisma-appointment-repository.ts`

A classe `PrismaAppointmentRepository` implementa o contrato `AppointmentRepository` utilizando Prisma ORM e PostgreSQL.

Além das consultas, a implementação utiliza transações com isolamento serializável e trata conflitos de concorrência durante a criação de agendamentos.

A integridade dos agendamentos também é protegida por uma restrição de exclusão no PostgreSQL, registrada em migration.

### 3.3. Justificativa

A utilização do Repository Pattern oferece:

- Separação entre lógica de aplicação e acesso ao banco.
- Menor acoplamento dos casos de uso ao Prisma.
- Possibilidade de utilizar implementações alternativas do repositório.
- Facilidade para testes com repositórios simulados.
- Organização das operações de persistência em uma classe específica.

O Repository Pattern foi escolhido porque o AgendaFlow precisa armazenar e consultar agendamentos mantendo suas regras de negócio independentes da tecnologia de banco de dados.

## 4. Princípios SOLID

### 4.1. S — Single Responsibility Principle (SRP)

O princípio da responsabilidade única orienta que cada módulo ou classe tenha uma responsabilidade principal.

No AgendaFlow, essa separação aparece nos seguintes arquivos:

- `src/application/appointments/create-appointment.ts`: criação e validação de agendamentos.
- `src/application/appointments/list-appointments.ts`: consulta de agendamentos e validação dos filtros.
- `src/http/routes/appointments.ts`: tratamento das requisições e respostas HTTP.
- `src/infra/repositories/prisma-appointment-repository.ts`: persistência e consultas ao PostgreSQL por meio do Prisma.

Essa divisão facilita a localização e a manutenção das regras.

### 4.2. D — Dependency Inversion Principle (DIP)

O princípio da inversão de dependência estabelece que componentes de alto nível não devem depender diretamente de detalhes de infraestrutura, mas de abstrações.

No AgendaFlow, os casos de uso `CreateAppointment` e `ListAppointments` recebem uma dependência do tipo `AppointmentRepository`.

Assim, eles não precisam instanciar ou conhecer diretamente o `PrismaClient`.

A implementação concreta é criada em `src/server.ts` e fornecida à aplicação por meio de `src/app.ts`.

Esse mecanismo caracteriza a **injeção de dependência por construtor**, utilizada em conjunto com a abstração do repositório.

## 5. Exemplo da composição das dependências

No arquivo `src/server.ts`, o projeto instancia:

`new PrismaAppointmentRepository(prisma)`

Essa instância é encaminhada à função:

`buildApp(repository)`

Em `src/app.ts`, o mesmo repositório é fornecido aos casos de uso:

- `new CreateAppointment(repository)`
- `new ListAppointments(repository)`

Com isso, o código responsável pelas regras de aplicação não precisa criar sua própria conexão com o banco de dados.

## 6. Relação com os testes

A utilização de interfaces e a separação das camadas permitem testar as regras de aplicação sem exigir uma conexão real com o PostgreSQL em todos os testes.

Os testes unitários podem utilizar implementações simuladas do contrato `AppointmentRepository`.

Já os testes de integração verificam o comportamento da aplicação em conjunto com a persistência real.

Essa estratégia contribui para testar tanto as regras isoladas quanto o funcionamento integrado do sistema.

## 7. Limitações e escopo

Este documento identifica especificamente os princípios **SRP** e **DIP**, pois ambos possuem evidências claras na implementação atual.

Não se afirma que todos os cinco princípios SOLID foram aplicados integralmente.

Da mesma forma, o Repository Pattern é apresentado como o padrão de projeto utilizado, sem atribuir à aplicação padrões que não foram implementados.

## 8. Conclusão

A arquitetura do AgendaFlow utiliza separação de responsabilidades, inversão de dependência e o Repository Pattern.

Essas decisões permitem manter os casos de uso desacoplados do Prisma ORM, organizar as responsabilidades do sistema e facilitar sua manutenção e seus testes.

A solução atende ao objetivo de demonstrar princípios SOLID e justificar um padrão de projeto dentro do escopo do Projeto B.
