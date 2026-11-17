import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 299 }, 409));

export const options = {
  vus: 5,
  duration: "15s",
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"]
  }
};

export default function () {
  // 1. Healthcheck
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "GET /health retorna 200": (r) => r.status === 200
  });

  // 2. Criação de agendamento com janela exclusiva por VU e iteração
  const dayOffset = (__ITER % 27) + 1;
  const day = String(dayOffset).padStart(2, "0");
  const monthOffset = ((__VU - 1) % 12) + 1;
  const month = String(monthOffset).padStart(2, "0");
  const year = 2027 + Math.floor((__VU - 1) / 12);

  const resourceId = `sala-k6-vu-${__VU}`;
  const payload = JSON.stringify({
    resourceId,
    startsAt: `${year}-${month}-${day}T10:00:00.000Z`,
    endsAt: `${year}-${month}-${day}T11:00:00.000Z`
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