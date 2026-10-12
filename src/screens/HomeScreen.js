import {
  Alert,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertText,
  Badge,
  BadgeText,
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Heading,
  HStack,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RouteMap from '../components/RouteMap';
import SearchBox from '../components/SearchBox';
import { ARRIVAL_THRESHOLD_M, OFF_ROUTE_THRESHOLD_M, REROUTE_COOLDOWN_MS } from '../config/constants';
import { useLocation } from '../hooks/useLocation';
import { fetchRoute } from '../services/routing';
import { distanceToRoute, formatDistance, formatDuration, haversine, remainingDistance } from '../utils/geo';

export default function HomeScreen() {
  const { permission, location, accuracy, error: locError, retry } = useLocation();

  const [destination, setDestination] = useState(null);
  const [destLabel, setDestLabel] = useState(null);
  const [route, setRoute] = useState(null); // { coordinates, distanceM, durationS }
  const [trail, setTrail] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | navigating | arrived
  const [error, setError] = useState(null);
  const [showArrival, setShowArrival] = useState(false);
  const lastReroute = useRef(0);
  const rerouting = useRef(false);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const navigating = status === 'navigating';

  const pickDestination = useCallback(
    (p, label) => {
      if (navigating || status === 'loading') return;
      setDestination(p);
      setDestLabel(label ?? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`);
      setRoute(null);
      setTrail([]);
      setStatus('idle');
      setError(null);
    },
    [navigating, status],
  );

  const createRoute = async () => {
    if (!location || !destination) return;
    setStatus('loading');
    setError(null);
    try {
      const r = await fetchRoute(location, destination);
      setRoute(r);
      setTrail([location]);
      lastReroute.current = Date.now();
      setStatus('navigating');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the route.');
      setStatus('idle');
    }
  };

  const stopTrip = () => {
    setStatus('idle');
    setRoute(null);
    setTrail([]);
  };

  // Real-time tracking: runs on every location update while navigating.
  useEffect(() => {
    if (!navigating || !location || !destination || !route) return;

    // 1. Record the travelled trail.
    setTrail((t) => {
      const last = t[t.length - 1];
      return last && haversine(last, location) < 1 ? t : [...t, location];
    });

    // 2. Arrival detection.
    const end = route.coordinates[route.coordinates.length - 1];
    const toDest = Math.min(haversine(location, destination), haversine(location, end));
    if (toDest <= ARRIVAL_THRESHOLD_M) {
      setStatus('arrived');
      setShowArrival(true);
      return;
    }

    // 3. Off-route detection -> automatic re-route.
    const { distanceM } = distanceToRoute(location, route.coordinates);
    if (distanceM > OFF_ROUTE_THRESHOLD_M && !rerouting.current && Date.now() - lastReroute.current > REROUTE_COOLDOWN_MS) {
      rerouting.current = true;
      lastReroute.current = Date.now();
      fetchRoute(location, destination)
        .then(setRoute)
        .catch(() => {})
        .finally(() => {
          rerouting.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const remaining = useMemo(
    () => (location && route && navigating ? remainingDistance(location, route.coordinates) : null),
    [location, route, navigating],
  );
  const eta = route && remaining != null ? (route.durationS * remaining) / Math.max(route.distanceM, 1) : null;
  const permissionDenied = permission === 'denied';

  return (
    <Box flex={1} bg="$backgroundLight50" flexDirection={isWide ? 'row' : 'column'}>
      {/* Map region: its own box with an isolated stacking context, never overlaps the controls. */}
      <Box flex={1} minHeight={isWide ? 0 : 240} style={{ position: 'relative', overflow: 'hidden', zIndex: 0, isolation: 'isolate' }}>
        <RouteMap
          userLocation={location}
          destination={destination}
          route={route?.coordinates ?? []}
          trail={trail}
          follow={navigating}
          onSelectDestination={(p) => pickDestination(p)}
        />
      </Box>

      {/* Control panel: sidebar (right) on wide screens, bottom panel on phones. */}
      <SafeAreaView
        edges={isWide ? ['top', 'bottom', 'right'] : ['bottom']}
        style={{
          width: isWide ? 400 : '100%',
          maxHeight: isWide ? undefined : '55%',
          backgroundColor: '#ffffff',
          zIndex: 10,
          borderTopWidth: isWide ? 0 : 1,
          borderLeftWidth: isWide ? 1 : 0,
          borderColor: '#e5e5e5',
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          <VStack space="md">
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="lg">Route Navigator</Heading>
              <Badge action={location ? 'success' : 'warning'} variant="solid" size="md">
                <BadgeText>{location ? `GPS ${accuracy ? `±${Math.round(accuracy)} m` : 'OK'}` : 'Locating…'}</BadgeText>
              </Badge>
            </HStack>

            {permission === 'unknown' && !locError && (
              <Alert action="info" variant="outline">
                <AlertText>Requesting location permission… please allow access when prompted.</AlertText>
              </Alert>
            )}
            {permissionDenied && (
              <Alert action="error" variant="outline">
                <VStack space="sm" flex={1}>
                  <AlertText>
                    Location permission was denied. Enable it in your {Platform.OS === 'web' ? 'browser site' : 'device'} settings, then retry.
                  </AlertText>
                  <Button size="sm" action="negative" onPress={retry}>
                    <ButtonText>Retry</ButtonText>
                  </Button>
                </VStack>
              </Alert>
            )}
            {(locError || error) && (
              <Alert action="error" variant="outline">
                <AlertText>{error ?? locError}</AlertText>
              </Alert>
            )}

            <SearchBox disabled={navigating || status === 'loading'} onPick={(p) => pickDestination(p, p.label)} />

            {destination ? (
              <Text size="sm" numberOfLines={3}>
                <Text bold size="sm">Destination: </Text>
                {destLabel}
              </Text>
            ) : (
              <Text size="xs" color="$textLight500">
                Search for a place above, or tap anywhere on the map to set the destination.
              </Text>
            )}

            {navigating && (
              <Alert action="info" variant="solid">
                <AlertText>🧭 Navigation active — follow the blue route. Your live position updates on the map.</AlertText>
              </Alert>
            )}
            {navigating && route && (
              <HStack space="md" justifyContent="space-around">
                <Stat label="Remaining" value={remaining != null ? formatDistance(remaining) : '—'} />
                <Stat label="ETA" value={eta != null ? formatDuration(eta) : '—'} />
                <Stat label="Total" value={formatDistance(route.distanceM)} />
              </HStack>
            )}
            {status === 'arrived' && (
              <Alert action="success" variant="solid">
                <AlertText>🎉 You have arrived at your destination!</AlertText>
              </Alert>
            )}

            {navigating ? (
              <Button action="negative" onPress={stopTrip}>
                <ButtonText>Stop navigation</ButtonText>
              </Button>
            ) : (
              <Button onPress={createRoute} isDisabled={!location || !destination || status === 'loading'}>
                {status === 'loading' && <ButtonSpinner mr="$2" />}
                <ButtonText>{status === 'arrived' ? 'Create a new route' : 'Create route & start'}</ButtonText>
              </Button>
            )}
            {!navigating && (!location || !destination) && (
              <Text size="xs" color="$textLight500">
                {!location ? 'Waiting for your location before a route can be created.' : 'Choose a destination to enable the route button.'}
              </Text>
            )}
          </VStack>
        </ScrollView>
      </SafeAreaView>

      <AlertDialog isOpen={showArrival} onClose={() => setShowArrival(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Destination reached 🎉</Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text>You have arrived{destLabel ? ` at ${destLabel}` : ''}.</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              onPress={() => {
                setShowArrival(false);
                setRoute(null);
                setTrail([]);
              }}
            >
              <ButtonText>OK</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}

function Stat({ label, value }) {
  return (
    <VStack alignItems="center">
      <Text size="xs" color="$textLight500">{label}</Text>
      <Heading size="md">{value}</Heading>
    </VStack>
  );
}
