import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import {
  fetchAllRegions,
  fetchAllPredictions,
  fetchHighRiskPredictions,
  fetchAiInsights,
} from "../services/dashboardService";

const PRIMARY = "#04047D";
const LIGHT_BLUE = "#ADD8E6";
const BG = "#f5f6fa";

function levelColor(level) {
  const l = String(level || "").toUpperCase();
  if (l === "HIGH") return "#e74c3c";
  if (l === "MEDIUM") return "#f39c12";
  if (l === "LOW") return "#2ecc71";
  return "#888";
}

function levelLabel(level) {
  const l = String(level || "").toUpperCase();
  if (l === "HIGH") return "Alto";
  if (l === "MEDIUM") return "Médio";
  if (l === "LOW") return "Baixo";
  return level || "—";
}

function urgencyLabel(urgency) {
  const u = String(urgency || "").toUpperCase();
  if (u === "CRITICO") return "Crítico";
  if (u === "ALTO") return "Alto";
  if (u === "MODERADO") return "Moderado";
  if (u === "BAIXO") return "Baixo";
  return urgency || "—";
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const color = levelColor(insight.levelNormalized);

  return (
    <TouchableOpacity
      style={[styles.insightCard, { borderLeftColor: color }]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
        <View style={styles.insightTitleBlock}>
          <View style={styles.insightTitleRow}>
            <Text style={styles.insightTitle} numberOfLines={2}>
              {insight.title}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: color }]}>
              <Text style={styles.levelBadgeText}>
                {urgencyLabel(insight.urgencyLevel)}
              </Text>
            </View>
          </View>
          <Text style={styles.insightRegion}>📍 {insight.regionName}</Text>
        </View>
      </View>

      <Text style={styles.insightDescription}>{insight.description}</Text>

      {insight.actionSuggestion ? (
        <>
          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setExpanded((v) => !v)}
          >
            <Text style={styles.expandToggleText}>
              {expanded ? "▲ Ocultar sugestão" : "▼ Ver sugestão de ação"}
            </Text>
          </TouchableOpacity>
          {expanded && (
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>💡 Sugestão para gestores</Text>
              <Text style={styles.actionText}>{insight.actionSuggestion}</Text>
            </View>
          )}
        </>
      ) : null}

      {insight.error && (
        <Text style={styles.insightError}>⚠️ IA indisponível para esta região</Text>
      )}
    </TouchableOpacity>
  );
}

function InsightSkeleton() {
  return (
    <View style={[styles.insightCard, { borderLeftColor: "#ddd" }]}>
      <View style={styles.insightHeader}>
        <View style={styles.skeletonIcon} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeletonLine, { width: "60%" }]} />
          <View style={[styles.skeletonLine, { width: "35%", height: 10 }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: "100%", marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { width: "80%", marginTop: 6 }]} />
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={PRIMARY} />
        <Text style={styles.loadingInsightText}>Consultando Gemini...</Text>
      </View>
    </View>
  );
}

function VulnerabilityBar({ regions }) {
  const high = regions.filter((r) => r.vulnerabilityLevel === "HIGH").length;
  const medium = regions.filter((r) => r.vulnerabilityLevel === "MEDIUM").length;
  const low = regions.filter((r) => r.vulnerabilityLevel === "LOW").length;
  const total = regions.length || 1;

  return (
    <View>
      <View style={styles.barRow}>
        <View style={[styles.barSegment, { flex: high / total, backgroundColor: "#e74c3c" }]} />
        <View style={[styles.barSegment, { flex: medium / total, backgroundColor: "#f39c12" }]} />
        <View style={[styles.barSegment, { flex: low / total, backgroundColor: "#2ecc71" }]} />
      </View>
      <View style={styles.barLegend}>
        <Text style={[styles.barLegendItem, { color: "#e74c3c" }]}>Alta: {high}</Text>
        <Text style={[styles.barLegendItem, { color: "#f39c12" }]}>Média: {medium}</Text>
        <Text style={[styles.barLegendItem, { color: "#2ecc71" }]}>Baixa: {low}</Text>
      </View>
    </View>
  );
}

function HighRiskRow({ prediction, regionName }) {
  const prob = prediction.increaseProbability
    ? `${Number(prediction.increaseProbability).toFixed(0)}%`
    : "—";
  return (
    <View style={styles.riskRow}>
      <View style={styles.riskRowLeft}>
        <View style={[styles.riskDot, { backgroundColor: levelColor(prediction.growthTrend) }]} />
        <Text style={styles.riskName}>{regionName}</Text>
      </View>
      <Text style={[styles.riskProb, { color: levelColor(prediction.growthTrend) }]}>{prob}</Text>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const [regions, setRegions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [highRisk, setHighRisk] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [regs, preds, highRiskPreds] = await Promise.all([
        fetchAllRegions(),
        fetchAllPredictions(),
        fetchHighRiskPredictions(),
      ]);
      setRegions(regs);
      setPredictions(preds);
      setHighRisk(highRiskPreds);
      return { regs, preds };
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Erro ao carregar dados do dashboard.";
      setError(msg);
      return null;
    }
  }, []);

  const loadInsights = useCallback(async (regs, preds) => {
    if (!regs || regs.length === 0) return;
    setLoadingInsights(true);
    setInsights([]);
    try {
      const result = await fetchAiInsights(regs, preds);
      setInsights(result);
    } catch (e) {
      setInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    setLoadingData(true);
    loadData()
      .then((result) => {
        if (result) loadInsights(result.regs, result.preds);
      })
      .finally(() => setLoadingData(false));
  }, [loadData, loadInsights]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData()
      .then((result) => {
        if (result) return loadInsights(result.regs, result.preds);
      })
      .finally(() => setRefreshing(false));
  }, [loadData, loadInsights]);

  const totalPop = regions.reduce((s, r) => s + (r.totalPopulation || 0), 0);
  const avgTime =
    regions.length > 0
      ? (
          regions.reduce((s, r) => s + (r.averageTimeOnStreetYears || 0), 0) /
          regions.length
        ).toFixed(1)
      : "—";
  const highRiskCount = regions.filter((r) => r.vulnerabilityLevel === "HIGH").length;
  const regionMap = Object.fromEntries(regions.map((r) => [r.id, r.name]));

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>
          Análise de vulnerabilidade social · São Paulo
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Pop. em situação de rua" value={totalPop.toLocaleString("pt-BR")} />
        <StatCard label="Regiões alto risco" value={highRiskCount} />
        <StatCard label="Tempo médio" value={`${avgTime} anos`} sub="em situação de rua" />
      </View>

      {/* Barra de vulnerabilidade */}
      {regions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição por vulnerabilidade</Text>
          <VulnerabilityBar regions={regions} />
        </View>
      )}

      {/* Insights de IA */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Insights gerados por IA</Text>
          <View style={styles.iaBadge}>
            <Text style={styles.iaBadgeText}>Gemini</Text>
          </View>
        </View>

        {loadingInsights && insights.length === 0 && (
          <>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </>
        )}

        {!loadingInsights && insights.length === 0 && (
          <Text style={styles.emptyText}>
            Sem dados suficientes para gerar insights.
          </Text>
        )}

        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}

        {loadingInsights && insights.length > 0 && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={PRIMARY} />
            <Text style={styles.loadingInsightText}>Gerando próximos insights...</Text>
          </View>
        )}
      </View>

      {/* Alto risco */}
      {highRisk.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regiões com risco acima de 70%</Text>
          {highRisk.map((p) => (
            <HighRiskRow
              key={p.id}
              prediction={p}
              regionName={regionMap[p.regionId] || `Região ${p.regionId}`}
            />
          ))}
        </View>
      )}

      {/* Todas as previsões */}
      {predictions.length > 0 && (
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Previsões por região</Text>
          {predictions.map((p) => {
            const name = regionMap[p.regionId] || `Região ${p.regionId}`;
            const prob = p.increaseProbability
              ? `${Number(p.increaseProbability).toFixed(0)}%`
              : "—";
            return (
              <View key={p.id} style={styles.predRow}>
                <View style={styles.predLeft}>
                  <Text style={styles.predName}>{name}</Text>
                  {p.aiJustification ? (
                    <Text style={styles.predJustification} numberOfLines={2}>
                      {p.aiJustification}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.predRight}>
                  <Text style={[styles.predProb, { color: levelColor(p.growthTrend) }]}>
                    {prob}
                  </Text>
                  <Text style={styles.predTrend}>{levelLabel(p.growthTrend)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: BG,
  },
  loadingText: { marginTop: 12, color: "#333", fontWeight: "600" },
  errorText: { color: "#B00020", textAlign: "center", fontWeight: "600", marginBottom: 16 },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 13, color: LIGHT_BLUE, marginTop: 2 },

  statsRow: { flexDirection: "row", padding: 12, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: PRIMARY },
  statLabel: { fontSize: 11, color: "#666", textAlign: "center", marginTop: 4 },
  statSub: { fontSize: 10, color: "#999", textAlign: "center" },

  section: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: PRIMARY,
    marginBottom: 12,
  },
  emptyText: { color: "#999", fontSize: 14 },

  iaBadge: {
    backgroundColor: "#4285F4",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 12,
  },
  iaBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  // Insight card
  insightCard: {
    backgroundColor: LIGHT_BLUE + "33",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  insightIcon: { fontSize: 22, marginTop: 2 },
  insightTitleBlock: { flex: 1 },
  insightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 3,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: PRIMARY,
    flex: 1,
  },
  insightRegion: { fontSize: 12, color: "#555" },
  levelBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  insightDescription: { fontSize: 13, color: "#333", lineHeight: 20 },
  insightError: { fontSize: 12, color: "#f39c12", marginTop: 6 },

  expandToggle: { marginTop: 8 },
  expandToggleText: { fontSize: 12, color: PRIMARY, fontWeight: "600" },
  actionBox: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddeeff",
  },
  actionLabel: { fontSize: 12, fontWeight: "bold", color: PRIMARY, marginBottom: 4 },
  actionText: { fontSize: 13, color: "#333", lineHeight: 19 },

  // Skeleton
  skeletonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
    marginRight: 4,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
    backgroundColor: "#e8e8e8",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  loadingInsightText: { fontSize: 12, color: "#888" },

  // Barra
  barRow: {
    flexDirection: "row",
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  barSegment: { height: "100%" },
  barLegend: { flexDirection: "row", gap: 16 },
  barLegendItem: { fontSize: 12, fontWeight: "600" },

  // Alto risco
  riskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  riskRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskName: { fontSize: 14, color: "#333", fontWeight: "500" },
  riskProb: { fontSize: 16, fontWeight: "bold" },

  // Previsões
  predRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
  },
  predLeft: { flex: 1 },
  predName: { fontSize: 14, fontWeight: "600", color: "#333" },
  predJustification: { fontSize: 12, color: "#666", marginTop: 2, lineHeight: 17 },
  predRight: { alignItems: "flex-end" },
  predProb: { fontSize: 18, fontWeight: "bold" },
  predTrend: { fontSize: 11, color: "#999" },
});
