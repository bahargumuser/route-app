import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Handles location permission and real-time position updates.
 * permission: 'unknown' | 'granted' | 'denied'
 * Works on iOS, Android and web (browser Geolocation API, needs https or localhost).
 */
export function useLocation() {
  const [permission, setPermission] = useState('unknown');
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const subscription = useRef(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      subscription.current?.remove();
      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 3,
        },
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy ?? null);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read your location.');
    }
  }, []);

  useEffect(() => {
    start();
    return () => {
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [start]);

  return { permission, location, accuracy, error, retry: start };
}
