import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";

import { regions } from "../data/regions";

export default function MapScreen() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [selectedTimeOnStreet, setSelectedTimeOnStreet] = useState(null);
  const [selectedShelterType, setSelectedShelterType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  const activeFiltersCount = [selectedGender, selectedAgeGroup, selectedTimeOnStreet, selectedShelterType].filter(Boolean).length;

  const filteredRegions = regions.filter((r) => {
    if (selectedRegion && r.id !== selectedRegion) return false;
    if (selectedGender && selectedGender === "Masculino" && r.malePercentage < 50) return false;
    if (selectedGender && selectedGender === "Feminino" && r.femalePercentage < 50) return false;
    if (selectedAgeGroup && r.ageGroup !== selectedAgeGroup) return false;
    if (selectedTimeOnStreet && r.timeOnStreetCategory !== selectedTimeOnStreet) return false;
    if (selectedShelterType && r.shelterType !== selectedShelterType) return false;
    return true;
  });

  const totalPopulation = filteredRegions.reduce((sum, r) => sum + r.population, 0);
  const avgUnemployment = filteredRegions.length > 0
    ? (filteredRegions.reduce((sum, r) => sum + r.unemploymentRate, 0) / filteredRegions.length).toFixed(1)
    : 0;
  const avgTimeOnStreet = filteredRegions.length > 0
    ? (filteredRegions.reduce((sum, r) => sum + r.timeOnStreetAvg, 0) / filteredRegions.length).toFixed(1)
    : 0;

  const FilterButton = ({ label, value, onPress, isActive }) => (
    <TouchableOpacity
      style={[styles.filterOption, isActive && styles.filterOptionActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>
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
            style={[
              styles.sidebarBackdrop,
              { opacity: backdropOpacity },
            ]}
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
                <FilterButton
                  label="Todos"
                  onPress={() => {
                    setSelectedGender(null);
                    setSelectedRegion(null);
                  }}
                  isActive={selectedGender === null}
                />
                <FilterButton
                  label="Masculino"
                  onPress={() => {
                    setSelectedGender("Masculino");
                    setSelectedRegion(null);
                  }}
                  isActive={selectedGender === "Masculino"}
                />
                <FilterButton
                  label="Feminino"
                  onPress={() => {
                    setSelectedGender("Feminino");
                    setSelectedRegion(null);
                  }}
                  isActive={selectedGender === "Feminino"}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Faixa Etária</Text>
                <FilterButton
                  label="Todos"
                  onPress={() => {
                    setSelectedAgeGroup(null);
                    setSelectedRegion(null);
                  }}
                  isActive={selectedAgeGroup === null}
                />
                {["18-30", "30-50", "50+"].map((age) => (
                  <FilterButton
                    key={age}
                    label={age}
                    onPress={() => {
                      setSelectedAgeGroup(age);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedAgeGroup === age}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tempo em Situação de Rua</Text>
                <FilterButton
                  label="Todos"
                  onPress={() => {
                    setSelectedTimeOnStreet(null);
                    setSelectedRegion(null);
                  }}
                  isActive={selectedTimeOnStreet === null}
                />
                {["<1 ano", "1-3 anos", "3+ anos"].map((time) => (
                  <FilterButton
                    key={time}
                    label={time}
                    onPress={() => {
                      setSelectedTimeOnStreet(time);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedTimeOnStreet === time}
                  />
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tipo de Acolhimento</Text>
                <FilterButton
                  label="Todos"
                  onPress={() => {
                    setSelectedShelterType(null);
                    setSelectedRegion(null);
                  }}
                  isActive={selectedShelterType === null}
                />
                {["Abrigo institucional", "Albergue municipal", "Acolhimento familiar"].map((shelter) => (
                  <FilterButton
                    key={shelter}
                    label={shelter}
                    onPress={() => {
                      setSelectedShelterType(shelter);
                      setSelectedRegion(null);
                    }}
                    isActive={selectedShelterType === shelter}
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
              description={`População: ${region.population}`}
              onPress={() => router.push(`/region/${region.id}`)}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.infoBox}>
      <Text style={styles.pageTitle}>
        Estatísticas {selectedRegion ? `- ${regions.find(r => r.id === selectedRegion)?.name}` : "Gerais"}
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