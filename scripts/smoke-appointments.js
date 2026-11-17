import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 5,
  duration: "15s",
  thresholds: {
    http_req_duration: ["p(95)<200"],
    checks: ["rate>0.99"]
  }
};

export default function () {
  // 1. Healthcheck
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "GET /health retorna 200": (r) => r.status === 200
  });

  // 2. Criação de agendamento com janela única por VU e iteração
  const dayOffset = (__VU * 100 + __ITER) % 27 + 1;
  const day = String(dayOffset).padStart(2, "0");
  const resourceId = `sala-k6-vu-${__VU}`;
  const payload = JSON.stringify({
    resourceId,
    startsAt: `2027-01-${day}T10:00:00.000Z`,
    endsAt: `2027-01-${day}T11:00:00.000Z`
  });

  const headers = { "Content-Type": "application/json" };
  const createRes = http.post(`${BASE_URL}/appointments`, payload, { headers });
  check(createRes, {
    "POST /appointments válido retorna 201 ou 409": (r) =>
      r.status === 201 || r.status === 409
  });

  // 3. Tentativa imediatamente conflitante no mesmo horário -> deve retornar 409
  const conflictRes = http.post(`${BASE_URL}/appointments`, payload, {
    headers
  });
  check(conflictRes, {
    "POST /appointments conflitante retorna 409": (r) => r.status === 409
  });

  // 4. Consulta de agendamentos filtrada por recurso
  const listRes = http.get(
    `${BASE_URL}/appointments?resourceId=${encodeURIComponent(resourceId)}`
  );
  check(listRes, {
    "GET /appointments retorna 200": (r) => r.status === 200
  });

  sleep(0.2);
}