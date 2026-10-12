import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { DEFAULT_REGION } from '../config/constants';

/**
 * Props: userLocation, destination, route (points[]), trail (points[]),
 * follow (bool), onSelectDestination(point)
 */
export default function RouteMap({ userLocation, destination, route, trail, follow, onSelectDestination }) {
  const ref = useRef(null);
  const centered = useRef(false);

  // Centre on the user the first time we get a fix.
  useEffect(() => {
    if (userLocation && !centered.current) {
      centered.current = true;
      ref.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
    }
  }, [userLocation]);

  // Fit the whole route when it is (re)created.
  useEffect(() => {
    if (route.length > 1) {
      ref.current?.fitToCoordinates(route, {
        edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
        animated: true,
      });
    }
  }, [route]);

  // Follow the user while travelling.
  useEffect(() => {
    if (follow && userLocation) {
      ref.current?.animateCamera({ center: userLocation, zoom: 17 }, { duration: 500 });
    }
  }, [follow, userLocation]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={{ ...DEFAULT_REGION, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
      showsUserLocation
      showsMyLocationButton
      onPress={(e) => onSelectDestination(e.nativeEvent.coordinate)}
    >
      {route.length > 1 && <Polyline coordinates={route} strokeColor="#2563eb" strokeWidth={6} />}
      {trail.length > 1 && <Polyline coordinates={trail} strokeColor="#16a34a" strokeWidth={6} />}
      {destination && <Marker coordinate={destination} title="Destination" pinColor="red" />}
    </MapView>
  );
}
