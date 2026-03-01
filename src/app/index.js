import { View, StyleSheet } from "react-native";
import MapView, { Heatmap, Marker } from "react-native-maps";
import { useRouter } from "expo-router";

import { regions } from "../data/regions";

export default function MapScreen() {
  const router = useRouter();

  const heatmapPoints = regions.map((region) => ({
    latitude: region.latitude,
    longitude: region.longitude,
    weight: region.population,
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -23.5505,
          longitude: -46.6333,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        <Heatmap
          points={heatmapPoints}
          radius={40}
          opacity={0.7}
        />

        {regions.map((region) => (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});