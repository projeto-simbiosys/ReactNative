import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import api from "../../config/axios";

export default function RegionDetail() {
  const { id } = useLocalSearchParams();
  const regionId = Array.isArray(id) ? id[0] : id;
  const [region, setRegion] = useState(null);
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [regionError, setRegionError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [predictionError, setPredictionError] = useState(null);

  useEffect(() => {
    if (!regionId) {
      setLoadingRegion(false);
      setRegionError("ID da região inválido.");
      return;
    }

    let active = true;

    const fetchRegion = async () => {
      setLoadingRegion(true);
      setRegionError(null);

      try {
        const response = await api.get(`/api/v1/regions/${regionId}`);
        const data = response?.data || null;

        if (active) {
          setRegion(data);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao carregar região.";

        if (active) {
          setRegionError(message);
        }
      } finally {
        if (active) {
          setLoadingRegion(false);
        }
      }
    };

    const fetchPrediction = async () => {
      setLoadingPrediction(true);
      setPredictionError(null);

      try {
        const response = await api.post(
          `/api/v1/regions/${regionId}/ai-report`,
        );
        const data = response?.data || null;

        if (active) {
          setPrediction(data);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao gerar previsão de IA.";

        if (active) {
          setPredictionError(message);
        }
      } finally {
        if (active) {
          setLoadingPrediction(false);
        }
      }
    };

    fetchRegion();
    fetchPrediction();

    return () => {
      active = false;
    };
  }, [regionId]);

  const vulnerabilityLabel = useMemo(() => {
    if (!region?.vulnerabilityLevel) return "Não informado";

    const level = String(region.vulnerabilityLevel).toUpperCase();
    if (level === "HIGH") return "Alto";
    if (level === "MEDIUM") return "Médio";
    if (level === "LOW") return "Baixo";

    return region.vulnerabilityLevel;
  }, [region?.vulnerabilityLevel]);

  const vulnerabilityColor = useMemo(() => {
    const level = String(region?.vulnerabilityLevel || "").toUpperCase();
    if (level === "HIGH") return "#e74c3c";
    if (level === "MEDIUM") return "#f39c12";
    if (level === "LOW") return "#2ecc71";
    return "#666";
  }, [region?.vulnerabilityLevel]);

  const growthTrendLabel = useMemo(() => {
    const trend = String(prediction?.growthTrend || "").toUpperCase();
    if (trend === "HIGH") return "Alta";
    if (trend === "MEDIUM") return "Média";
    if (trend === "LOW") return "Baixa";
    return prediction?.growthTrend || "";
  }, [prediction?.growthTrend]);

  const unemploymentRate =
    typeof region?.unemploymentRate === "number"
      ? `${region.unemploymentRate.toFixed(1)}%`
      : "Não informado";

  const averageTimeOnStreet =
    typeof region?.averageTimeOnStreetYears === "number"
      ? `${region.averageTimeOnStreetYears.toFixed(1)} anos`
      : "Não informado";

  const totalPopulation =
    typeof region?.totalPopulation === "number"
      ? region.totalPopulation
      : "Não informado";

  const coordinates =
    typeof region?.latitude === "number" &&
    typeof region?.longitude === "number"
      ? `${region.latitude}, ${region.longitude}`
      : "Não informado";

  if (loadingRegion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#04047D" />
        <Text style={styles.statusText}>Carregando dados da região...</Text>
      </View>
    );
  }

  if (regionError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erro: {regionError}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>Região não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{region.name}</Text>
      <Text style={styles.subtitle}>
        Subprefeitura: {region.subprefecture || "Não informado"}
      </Text>

      <View style={styles.gridContainer}>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.label}>Nível de vulnerabilidade</Text>
            <Text style={[styles.value, { color: vulnerabilityColor }]}>
              {vulnerabilityLabel}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Tempo médio em situação de rua</Text>
            <Text style={styles.value}>{averageTimeOnStreet}</Text>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.label}>População total</Text>
            <Text style={styles.value}>{totalPopulation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Coordenadas</Text>
        <Text style={styles.value}>{coordinates}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Previsão de IA</Text>
        {loadingPrediction && (
          <Text style={styles.infoText}>Gerando previsão da IA...</Text>
        )}

        {!loadingPrediction && predictionError && (
          <Text style={styles.infoText}>
            Não foi possível gerar a previsão: {predictionError}
          </Text>
        )}

        {!loadingPrediction &&
          !predictionError &&
          prediction?.predictionJustification && (
            <Text style={styles.infoText}>
              {prediction.predictionJustification}
            </Text>
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusText: {
    marginTop: 12,
    color: "#333",
    fontWeight: "600",
  },
  errorText: {
    color: "#B00020",
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "600",
  },
  title: {
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: "#666",
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 8,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  infoBox: {
    backgroundColor: "#ADD8E6",
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
