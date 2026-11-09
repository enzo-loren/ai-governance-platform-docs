/* Costos AWS: modelo referencial auditado (2026-11-08), sin facturación real.
 * Fuentes y fórmula: docs/arquitectura-aws-auditada.md §6.
 * El diagrama A/B/C es conceptual: nunca inferir costos MCP o C de sus toggles.
 */
(function () {
  "use strict";
  const section = document.getElementById("costos");
  if (!section) return;
  const $ = id => section.querySelector("#costs-" + id);
  const scenarios = [10000, 300000, 3000000];
  const money = value => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value);
  const perCall = value => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 5, maximumFractionDigits: 5
  }).format(value);
  const inputs = ["n", "model", "guard", "inputTokens", "outputTokens", "lambdaTime",
    "wru", "rru", "evidence", "logs", "api", "months"];

  function value(id) {
    const el = $(id);
    const x = Number(el.value);
    const min = Number(el.min || 0);
    const max = el.max ? Number(el.max) : Number.MAX_SAFE_INTEGER;
    return Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : min;
  }
  function parameters() {
    return Object.fromEntries(inputs.filter(id => id !== "n" && id !== "model")
      .map(id => [id, value(id)]));
  }
  function estimate(n, model, p) {
    // Es el mismo modelo de cálculo del informe auditado; los montos no son TCO.
    const bytesPerGiB = 1024 ** 3;
    const modelRate = model === "120" ? [0.15, 0.60] :
      model === "20" ? [0.07, 0.30] : [0, 0];
    const lines = [
      ["AWS WAF", "2 ACL + 3 reglas + tráfico de ambas API", 13 + (n + p.api) * 0.60 / 1e6],
      ["API Gateway REST", "Inferencia + llamadas administrativas; sin egreso", 3.5 * (n + p.api) / 1e6],
      ["AgentCore Gateway", "Hipótesis $5/M para inferencia; confirmar en Billing", 5 * n / 1e6],
      ["AWS Lambda", "Fachada 256 MiB + 2 interceptores × 0,15 s", n * (3 * 0.20 / 1e6 + 0.25 * (p.lambdaTime + 0.30) * 0.0000166667)],
      ["Amazon DynamoDB", "WRU y RRU supuestas, sin almacenamiento adicional", n * (p.wru * 0.625 + p.rru * 0.125) / 1e6],
      ["Amazon S3", "1 PUT por solicitud + retención equivalente", n * 5 / 1e6 + n * p.evidence * 1024 / bytesPerGiB * 0.023 * p.months],
      ["Bedrock Guardrails", "Solo filtro de contenido, unidades de texto", n * p.guard * 0.15 / 1000],
      ["Modelo en Bedrock", "Tarifas SP-03 por tokens de entrada / salida", n * (p.inputTokens * modelRate[0] + p.outputTokens * modelRate[1]) / 1e6],
      ["CloudWatch Logs", "Solo ingestión ilustrativa de registros", n * p.logs * 1024 / bytesPerGiB * 0.50],
      ["KMS + Secrets Manager", "1 clave + 1 secreto; excluye llamadas", 1.40]
    ];
    return {lines, total: lines.reduce((sum, item) => sum + item[2], 0)};
  }

  function render() {
    const n = value("n");
    const model = $("model").value;
    const p = parameters();
    scenarios.forEach(count => {
      const amount = estimate(count, model, p).total;
      $("scenario-" + count).textContent = money(amount);
      $("scenario-unit-" + count).textContent = perCall(amount / count) + " / solicitud";
    });
    section.querySelectorAll(".costs-scenario").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.volume) === n));
    });
    const result = estimate(n, model, p);
    $("monthly").textContent = money(result.total);
    $("per-request").textContent = n > 0 ? perCall(result.total / n) : "Sin solicitudes";
    const body = $("rows");
    const fragment = document.createDocumentFragment();
    result.lines.forEach(([title, assumption, amount]) => {
      const row = document.createElement("tr");
      [title, assumption, money(amount)].forEach((text, index) => {
        const cell = document.createElement("td");
        cell.textContent = text;
        if (index === 2) cell.className = "costs-money";
        row.appendChild(cell);
      });
      fragment.appendChild(row);
    });
    body.replaceChildren(fragment);
  }

  section.querySelectorAll(".costs-scenario").forEach(button => {
    button.addEventListener("click", () => {
      $("n").value = button.dataset.volume;
      render();
    });
  });
  inputs.forEach(id => {
    const input = $(id);
    input.addEventListener("input", render);
    input.addEventListener("change", () => {
      if (input.type === "number") input.value = String(value(id));
      render();
    });
  });
  render();
})();
