# Relatório de Desempenho, Concorrência e Observabilidade

Este documento registra a estratégia de proteção contra concorrência, os mecanismos de observabilidade (logs estruturados, métricas e SLO) e os resultados reais do smoke test executado com **k6** na API **AgendaFlow**.

---

## 1. Estratégia de Proteção Contra Concorrência

Para evitar reservas duplicadas ou sobrepostas sob requisições simultâneas para o mesmo recurso, foi adotada uma defesa em duas camadas no PostgreSQL e na camada de repositório:

1. **Exclusion Constraint nativa no PostgreSQL (`EXCLUDE USING gist`):**
   - Extensão `btree_gist` habilitada e constraint `appointments_no_overlapping_active` aplicada na tabela `appointments`.
   - Bloqueia fisicamente no banco qualquer sobreposição de intervalos semiabertos (`tsrange("startsAt", "endsAt", '[)') WITH &&`) para o mesmo `resourceId` com `status = 'ACTIVE'`, mantendo agendamentos consecutivos válidos.
2. **Transação `Serializable` com Retry e Mapeamento para `409 Conflict`:**
   - A verificação de conflito e a gravação em `PrismaAppointmentRepository.create` ocorrem dentro de transação com isolamento `Serializable`.
   - Falhas de serialização (`P2034` / SQLSTATE `40001`) realizam nova tentativa controlada, e qualquer conflito confirmado ou violação de exclusão (`23P01`) é convertido em `AppointmentConflictError`, retornando HTTP **`409 Conflict`**.

---

## 2. Observabilidade e SLO

### 2.1 Logs Estruturados
A aplicação utiliza o logger JSON nativo do Fastify (Pino) identificado por `"service": "agendaflow"`. A cada resposta concluída (`onResponse`), é emitido o evento estruturado `http_request_completed` contendo:
- `method`: método HTTP da requisição;
- `route`: rota normalizada;
- `statusCode`: código HTTP devolvido (`200`, `201`, `400`, `409`, etc.);
- `durationMs`: tempo total de processamento em milissegundos.

### 2.2 Métricas (`GET /metrics`)
O endpoint `GET /metrics` expõe em tempo real os contadores acumulados da instância:
- `httpRequestsTotal`: total de requisições HTTP atendidas;
- `appointmentsCreatedTotal`: total de agendamentos criados com sucesso (`201 Created`);
- `appointmentsConflictTotal`: total de tentativas conflitantes bloqueadas (`409 Conflict`);
- `serverErrorsTotal`: total de erros internos (`5xx`);
- `averageDurationMs` e `maxDurationMs`: latência média e máxima observadas;
- `observedAvailability`: disponibilidade calculada a partir das requisições sem erro `5xx`.

### 2.3 Service Level Objectives (SLO)

| Indicador (SLI) | Meta (SLO) | Critério de Avaliação |
| :--- | :--- | :--- |
| **Disponibilidade** | `>= 99,5%` (`0.995`) | Proporção de requisições sem erro interno (`statusCode < 500`) |
| **Latência p95** | `< 200 ms` | Percentil 95 de `http_req_duration` no smoke test k6 |
| **Taxa de sucesso dos checks** | `> 99,0%` | Validação funcional de `200`, `201` e `409` no fluxo ponta a ponta |

---

## 3. Smoke Test com k6 (`scripts/smoke-appointments.js`)

### 3.1 Cenário Executado
- **Ferramenta:** Grafana k6 `v2.4.0`
- **Comando:** `npm run test:smoke` (`k6 run scripts/smoke-appointments.js`)
- **Carga:** `5 VUs` (usuários virtuais simultâneos) durante `15s` (`sleep(0.2)` por iteração)
- **Fluxo por iteração:**
  1. `GET /health` (esperado `200`)
  2. `POST /appointments` com horário válido (esperado `201` ou `409`)
  3. `POST /appointments` repetindo imediatamente o mesmo recurso e período (esperado `409`)
  4. `GET /appointments?resourceId=...` (esperado `200`)

### 3.2 Resultados Obtidos

| Métrica k6 | Valor Medido | Meta / Threshold | Status |
| :--- | :--- | :--- | :--- |
| `http_reqs` (total / vazão) | `1.320` reqs (`86,73 req/s`) | — | ✅ |
| `checks` aprovados | `100,00%` (`1.320 / 1.320`) | `> 99,00%` | ✅ Aprovado |
| `http_req_failed` | `0,00%` (`0 / 1.320`) | `< 1,00%` | ✅ Aprovado |
| `http_req_duration` — média (`avg`) | `6,58 ms` | — | ✅ |
| `http_req_duration` — mediana (`med`) | `6,81 ms` | — | ✅ |
| `http_req_duration` — `p(90)` | `10,18 ms` | — | ✅ |
| `http_req_duration` — **`p(95)`** | **`11,84 ms`** | **`< 200 ms`** | ✅ **Aprovado** |
| `http_req_duration` — máxima (`max`) | `118,86 ms` | — | ✅ |

### 3.3 Leitura Consolidada de `GET /metrics` Após o Teste

```json
{
  "service": "agendaflow",
  "slo": {
    "availabilityTarget": 0.995,
    "latencyP95TargetMs": 200
  },
  "metrics": {
    "httpRequestsTotal": 3664,
    "appointmentsCreatedTotal": 243,
    "appointmentsConflictTotal": 1589,
    "serverErrorsTotal": 0,
    "averageDurationMs": 10.03,
    "maxDurationMs": 188.6,
    "observedAvailability": 1
  }
}