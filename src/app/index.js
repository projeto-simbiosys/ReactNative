import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";

import api from "../config/axios";

const GENDER_OPTIONS = [
  { label: "Todos", value: "ALL" },
  { label: "Masculino", value: "MALE" },
  { label: "Feminino", value: "FEMALE" },
];

const AGE_RANGE_OPTIONS = [
  { label: "Todos", value: "ALL" },
  { label: "18-30", value: "EIGHTEEN_TO_THIRTY" },
  { label: "30-50", value: "THIRTY_TO_FIFTY" },
  { label: "> 50", value: "ABOVE_FIFTY" },
];

const VULNERABILITY_TIME_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "< 1 ano", value: "LESS_THAN_ONE_YEAR" },
  { label: "1-3 anos", value: "ONE_TO_THREE_YEARS" },
  { label: "3-5 anos", value: "THREE_TO_FIVE_YEARS" },
  { label: "> 5 anos", value: "MORE_THAN_FIVE_YEARS" },
];

const VULNERABILITY_LEVEL_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Alta", value: "HIGH" },
  { label: "Média", value: "MEDIUM" },
  { label: "Baixa", value: "LOW" },
];

export default function MapScreen() {
  const router = useRouter();
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [regionsError, setRegionsError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [selectedAgeRange, setSelectedAgeRange] = useState("ALL");
  const [selectedVulnerabilityTime, setSelectedVulnerabilityTime] =
    useState("");
  const [selectedVulnerabilityLevel, setSelectedVulnerabilityLevel] =
    useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      setRegionsError(null);

      try {
        const baseURL = api.defaults.baseURL;
        const endpoint = "/api/v1/regions";

        if (!baseURL) {
          throw new Error("EXPO_PUBLIC_API_URL não está definida.");
        }

        const params = {
          gender: selectedGender,
          ageRange: selectedAgeRange,
          timeOnStreet: selectedVulnerabilityTime,
          vulnerabilityLevel: selectedVulnerabilityLevel,
        };

        console.log("Buscando regiões em:", `${baseURL}${endpoint}`, params);
        const response = await api.get(endpoint, { params });
        console.log("Status resposta regiões:", response.status);

        const data = Array.isArray(response.data) ? response.data : [];
        setRegions(data);
      } catch (error) {
        console.error(error);
        const baseURL = api.defaults.baseURL;
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (error?.message === "Network Error"
            ? `Falha de conexão com a API em ${baseURL}. Verifique host/porta, firewall e se o back-end está ativo.`
            : error?.message) ||
          "Erro desconhecido";

        console.error("Erro ao carregar regiões:", {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          data: error?.response?.data,
          baseURL,
        });

        setRegionsError(`Não foi possível carregar as regiões: ${message}`);
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, [
    selectedGender,
    selectedAgeRange,
    selectedVulnerabilityTime,
    selectedVulnerabilityLevel,
  ]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    Animated.timing(slideAnim, {
      toValue: newState ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["100%", "0%"],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  const activeFiltersCount = [
    selectedGender !== "ALL",
    selectedAgeRange !== "ALL",
    selectedVulnerabilityTime !== "",
    selectedVulnerabilityLevel !== "",
  ].filter(Boolean).length;

  const filteredRegions = regions.filter((r) => {
    if (selectedRegion && r.id !== selectedRegion) return false;
    return true;
  });

  const totalPopulation = filteredRegions.reduce(
    (sum, r) => sum + (r.totalPopulation || 0),
    0,
  );
  const avgUnemployment =
    filteredRegions.length > 0
      ? (
          filteredRegions.reduce(
            (sum, r) => sum + (r.unemploymentRate || 0),
            0,
          ) / filteredRegions.length
        ).toFixed(1)
      : 0;
  const avgTimeOnStreet =
    filteredRegions.length > 0
      ? (
          filteredRegions.reduce(
            (sum, r) => sum + (r.averageTimeOnStreetYears || 0),
            0,
          ) / filteredRegions.length
        ).toFixed(1)
      : 0;

  const FilterButton = ({ label, value, onPress, isActive }) => (
    <TouchableOpacity
      style={[styles.filterOption, isActive && styles.filterOptionActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterOptionText,
          isActive && styles.filterOptionTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.regionFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedRegion === null && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedRegion(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedRegion === null && styles.filterButtonTextActive,
              ]}
            >
              Todas Regiões
            </Text>
          </TouchableOpacity>
          {regions.map((region) => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.filterButton,
                selectedRegion === region.id && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedRegion(region.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedRegion === region.id && styles.filterButtonTextActive,
                ]}
              >
                {region.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.filterMenuButton}
          onPress={toggleSidebar}
        >
          <Text style={styles.filterMenuButtonText}>⚙️ Filtros</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {sidebarOpen && (
        <>
          <Animated.View
            style={[styles.sidebarBackdrop, { opacity: backdropOpacity }]}
            onTouchEnd={toggleSidebar}
          />
          <Animated.View
            style={[
              styles.sidebar,
              { transform: [{ translateX: slideInterpolate }] },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Filtros Avançados</Text>
              <TouchableOpacity onPress={toggleSidebar}>
                <Text style={styles.sidebarCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Gênero</Text>
                {GENDER_OPTIONS.map((genderOption) => (
                  <FilterButton
                    key={genderOption.value}
                    label={genderOption.label}
                    onPress={() => {
                      setSelectedGender(genderOption.value);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedGender === genderOption.value}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Faixa Etária</Text>
                {AGE_RANGE_OPTIONS.map((ageRangeOption) => (
                  <FilterButton
                    key={ageRangeOption.value}
                    label={ageRangeOption.label}
                    onPress={() => {
                      setSelectedAgeRange(ageRangeOption.value);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedAgeRange === ageRangeOption.value}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Tempo de Vulnerabilidade
                </Text>
                {VULNERABILITY_TIME_OPTIONS.map((timeOption) => (
                  <FilterButton
                    key={timeOption.value}
                    label={timeOption.label}
                    onPress={() => {
                      setSelectedVulnerabilityTime(timeOption.value);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedVulnerabilityTime === timeOption.value}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Nível de Vulnerabilidade
                </Text>
                {VULNERABILITY_LEVEL_OPTIONS.map((vulnerabilityOption) => (
                  <FilterButton
                    key={
                      vulnerabilityOption.value || "EMPTY_VULNERABILITY_LEVEL"
                    }
                    label={vulnerabilityOption.label}
                    onPress={() => {
                      setSelectedVulnerabilityLevel(vulnerabilityOption.value);
                      setSelectedRegion(null);
                    }}
                    isActive={
                      selectedVulnerabilityLevel === vulnerabilityOption.value
                    }
                  />
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -23.5505,
            longitude: -46.6333,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
        >
          {filteredRegions.map((region) => (
            <Circle
              key={`heat-${region.id}`}
              center={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              radius={500}
              fillColor="rgba(255, 0, 0, 0.3)"
              strokeColor="rgba(255, 0, 0, 0.5)"
              strokeWidth={1}
            />
          ))}

          {filteredRegions.map((region) => (
            <Marker
              key={region.id}
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title={region.name}
              description={`População: ${region.totalPopulation || 0}`}
              onPress={() => router.push(`/region/${region.id}`)}
            />
          ))}
        </MapView>
        {loadingRegions && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#04047D" />
            <Text style={styles.loadingText}>Carregando regiões...</Text>
          </View>
        )}
        {!loadingRegions && regionsError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{regionsError}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.pageTitle}>
          Estatísticas{" "}
          {selectedRegion
            ? `- ${regions.find((r) => r.id === selectedRegion)?.name}`
            : "Gerais"}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>População Total</Text>
              <Text style={styles.infoValue}>{totalPopulation}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Desemprego Médio</Text>
              <Text style={styles.infoValue}>{avgUnemployment}%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tempo Médio Rua</Text>
              <Text style={styles.infoValue}>{avgTimeOnStreet} anos</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  regionFilterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterMenuButton: {
    backgroundColor: "#ADD8E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    position: "relative",
  },
  filterMenuButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  filterBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "#fff",
    zIndex: 100,
    flexDirection: "column",
  },
  sidebarBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 99,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#04047D",
  },
  sidebarCloseButton: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
  },
  sidebarContent: {
    backgroundColor: "#fff",
    flex: 1,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterOptionActive: {
    backgroundColor: "#ADD8E6",
    borderColor: "#ADD8E6",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#666",
  },
  filterOptionTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  mapWrapper: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#333",
    fontWeight: "600",
  },
  errorBox: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FDECEA",
    borderColor: "#F5C2C0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: "#B00020",
    textAlign: "center",
    fontWeight: "600",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 8,
    alignSelf: "center",
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: "#ADD8E6",
    borderColor: "#ADD8E6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#000",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  infoBox: {
    borderTopWidth: 1,
    borderColor: "#04047D",
  },
  infoCard: {
    backgroundColor: "#ADD8E6",
    padding: 16,
    margin: 12,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#04047D4D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  map: { flex: 1 },
});
