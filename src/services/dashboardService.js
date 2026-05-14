import api from "../config/axios";

export async function fetchAllRegions() {
  const response = await api.get("/api/v1/regions");
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchHighRiskPredictions() {
  const response = await api.get("/api/v1/predictions/high-risk");
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchAllPredictions() {
  const response = await api.get("/api/v1/predictions");
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Busca o relatório narrativo real gerado pelo Gemini para uma região.
 * Retorna: { narrativeReport, predictionJustification, actionSuggestion, urgencyLevel }
 */
export async function fetchAiReport(regionId) {
  const response = await api.post(`/api/v1/regions/${regionId}/ai-report`);
  return response.data;
}

/**
 * Gera os 3 insights de IA usando o endpoint real do Gemini.
 *
 * Estratégia:
 *   Insight 1 -> regiao com maior probabilidade de crescimento
 *   Insight 2 -> regiao com abrigos mais superlotados
 *   Insight 3 -> regiao com maior tempo medio em situacao de rua
 *
 * Para cada uma, chama POST /api/v1/regions/{id}/ai-report e usa
 * os campos narrativos retornados pelo Gemini.
 */
export async function fetchAiInsights(regions, predictions) {
  const icons = ["📈", "🏚️", "⏳"];
  const titles = [
    "Maior risco de crescimento",
    "Capacidade de abrigo crítica",
    "Maior tempo médio em situação de rua",
  ];

  const regionMap = Object.fromEntries(regions.map((r) => [r.id, r]));

  // Regiao 1: maior probabilidade de crescimento
  let region1 = null;
  if (predictions.length > 0) {
    const top = predictions.reduce((a, b) =>
      (a.increaseProbability || 0) > (b.increaseProbability || 0) ? a : b
    );
    region1 = regionMap[top.regionId] || regions[0] || null;
  } else if (regions.length > 0) {
    region1 = regions[0];
  }

  // Regiao 2: abrigos mais superlotados
  let region2 = null;
  const withCapacity = regions.filter(
    (r) =>
      typeof r.shelteredCount === "number" &&
      typeof r.shelterCapacity === "number" &&
      r.shelterCapacity > 0
  );
  if (withCapacity.length > 0) {
    region2 = withCapacity.reduce((a, b) =>
      a.shelteredCount / a.shelterCapacity > b.shelteredCount / b.shelterCapacity
        ? a
        : b
    );
  } else if (regions.length > 1) {
    region2 = regions[1];
  }

  // Regiao 3: maior tempo medio nas ruas
  let region3 = null;
  const withTime = regions.filter(
    (r) => typeof r.averageTimeOnStreetYears === "number"
  );
  if (withTime.length > 0) {
    region3 = withTime.reduce((a, b) =>
      (a.averageTimeOnStreetYears || 0) > (b.averageTimeOnStreetYears || 0)
        ? a
        : b
    );
  } else if (regions.length > 2) {
    region3 = regions[2];
  }

  const targets = [region1, region2, region3];

  // Chama o Gemini para cada uma em paralelo
  const reports = await Promise.allSettled(
    targets.map((r) => (r ? fetchAiReport(r.id) : Promise.reject("sem regiao")))
  );

  return reports.map((result, i) => {
    const target = targets[i];

    if (result.status === "fulfilled") {
      const report = result.value;
      return {
        id: `insight-${i + 1}`,
        icon: icons[i],
        title: titles[i],
        regionName: report.regionName || target?.name || "—",
        description:
          report.predictionJustification || report.narrativeReport || "Sem dados.",
        actionSuggestion: report.actionSuggestion || null,
        urgencyLevel: report.urgencyLevel || "MODERADO",
        levelNormalized: normalizeUrgency(report.urgencyLevel),
        error: false,
      };
    }

    return {
      id: `insight-${i + 1}`,
      icon: icons[i],
      title: titles[i],
      regionName: target?.name || "—",
      description: "Não foi possível gerar o insight de IA para esta região.",
      actionSuggestion: null,
      urgencyLevel: "MODERADO",
      levelNormalized: "MEDIUM",
      error: true,
    };
  });
}

function normalizeUrgency(urgencyLevel) {
  const u = String(urgencyLevel || "").toUpperCase();
  if (u === "CRITICO" || u === "ALTO" || u === "HIGH") return "HIGH";
  if (u === "MODERADO" || u === "MEDIUM") return "MEDIUM";
  if (u === "BAIXO" || u === "LOW") return "LOW";
  return "MEDIUM";
}
