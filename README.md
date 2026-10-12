# Route Navigator (Expo + React Native + gluestack-ui, JavaScript)

Creates a route from your current location to a destination, tracks you live along it, and tells you when you arrive. Runs on iOS, Android and web.

## Run it from VS Code
1. Install Node.js 20+ and VS Code. On your phone install **Expo Go**.
2. `File > Open Folder…` → this folder. Open the terminal with `` Ctrl+` ``.
3. `npm install`
4. **Mobile:** `npx expo start`, then scan the QR code with Expo Go (Android) or the Camera app (iOS). Phone and computer must be on the same Wi-Fi (or use `npx expo start --tunnel`). Accept the location prompt.
   `npm run android` / `npm run ios` open an emulator/simulator instead.
5. **Web:** `npm run web` → opens http://localhost:8081. Allow location in the browser (needs localhost or https).

## Using it
Search a place or tap the map to set the destination → **Create route & start**. Blue = route, green = path you travelled. Arrival (within 30 m) shows a dialog. Going >80 m off route triggers an automatic re-route.

## Structure
- `App.js` – gluestack provider
- `src/screens/HomeScreen.js` – UI, trip state, arrival + off-route logic
- `src/components/RouteMap.native.js` / `.web.js` – react-native-maps / Leaflet
- `src/components/SearchBox.js` – address search
- `src/hooks/useLocation.js` – permissions + live GPS
- `src/services/` – OSRM routing, Nominatim geocoding (free, no keys)
- `src/utils/geo.js` – distance helpers
- `src/config/constants.js` – thresholds and endpoints

Notes: OSRM/Nominatim public servers are for demos; use your own or a paid provider in production. Background tracking is not enabled (foreground only).
