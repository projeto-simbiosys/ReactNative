import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "expo-router";
import { useEffect } from "react";

import { regions } from "../../data/regions";

export default function RegionDetail() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  
  useEffect(() => {
    navigation.setOptions({ title: region.name });
  }, []);

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
      <Text style={styles.title}>{region.name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>População estimada</Text>
        <Text style={styles.value}>{region.population}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Distribuição por gênero</Text>
        <Text style={styles.value}>
          Masculino: {region.malePercentage}%
        </Text>
        <Text style={styles.value}>
          Feminino: {region.femalePercentage}%
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Idade média</Text>
        <Text style={styles.value}>{region.avgAge} anos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Taxa de desemprego</Text>
        <Text style={styles.value}>{region.unemploymentRate}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tempo médio em situação de rua</Text>
        <Text style={styles.value}>
          {region.timeOnStreetAvg} anos
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: { fontSize: 14, color: "#666" },
  value: { fontSize: 18, fontWeight: "600", marginTop: 4 },
});