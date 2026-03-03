import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { regions } from "../../data/regions";

export default function RegionDetail() {
  const { id } = useLocalSearchParams();

  const region = regions.find((r) => r.id === id);

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>Região não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: region.image }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.title}>{region.name}</Text>

      <View style={styles.gridContainer}>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.label}>Nível de vulnerabilidade</Text>
            <Text style={[styles.value, { color: region.unemploymentRate > 60 ? "#e74c3c" : "#f39c12" }]}>
              {region.unemploymentRate > 60 ? "Alto" : "Médio"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Taxa de desemprego</Text>
            <Text style={styles.value}>{region.unemploymentRate}%</Text>
          </View>
        </View>

        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.label}>Idade média</Text>
            <Text style={styles.value}>{region.avgAge} anos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Tempo médio em situação de rua</Text>
            <Text style={styles.value}>
              {region.timeOnStreetAvg} anos
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Distribuição por gênero</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          <Text style={styles.value}>
            Masculino: {region.malePercentage}%
          </Text>
          <Text style={styles.value}>
            Feminino: {region.femalePercentage}%
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Análise da Região</Text>
        <Text style={styles.infoText}>
          {region.population} pessoas em situação de rua nesta região. A idade média é de {region.avgAge} anos,
          com tempo médio de {region.timeOnStreetAvg} anos nas ruas. A taxa de desemprego de {region.unemploymentRate}%
          indica {region.unemploymentRate > 60 ? "uma situação crítica" : "uma situação desafiadora"} que requer atenção especial.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: {
    width: '100%',
    height: 200,
  },
  title: {
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
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