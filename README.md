# Unilux Thermostat V2 - React Edition

A modern, responsive smart thermostat control app built with React, TypeScript, and Vite. Features MQTT integration for real-time device communication and full PWA support for offline functionality.

## Features

- **React 18** with TypeScript for type-safe development
- **Real-time MQTT** communication with Unilux thermostat devices
- **Progressive Web App (PWA)** support with offline capabilities and service worker
- **Dark/Light Theme Toggle** with localStorage persistence
- **Responsive Design** that works on all devices
- **Temperature Control** with slider and +/- buttons
- **Mode Selection** (Heat, Cool, Auto)
- **Fan Control** (Auto, Off, Low, Med, High)
- **Real-time Status** display showing connection state and room temperature

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with HMR
- **PWA**: vite-plugin-pwa with Workbox service worker
- **MQTT**: mqtt.js for device communication
- **Styling**: CSS3 with CSS variables for theming

## Development

Install dependencies:
```sh
npm install --legacy-peer-deps
```

Start the development server:
```sh
npm run dev
```

The app will be available at `http://localhost:5173`

## Building

To create a production build:
```sh
npm run build
```

The optimized build output is in the `dist/` directory with:
- Service worker (`sw.js`) for offline support
- Manifest file (`manifest.webmanifest`) for PWA installation
- Precompressed assets

Preview the production build:
```sh
npm run preview
```

## PWA Installation

The app is a fully functional PWA that can be installed on:
- **iOS**: Save to Home Screen
- **Android**: Install App via browser menu
- **Desktop**: Install App button in browsers

## Usage

1. Run the app (dev or production)
2. Enter your Device ID when prompted (saved to localStorage)
3. The app will connect to your thermostat via MQTT
4. Control temperature, mode, and fan settings in real-time

## Device Communication

The app communicates with Unilux thermostats via:
- **MQTT Broker**: `ws://mqapi.uniluxthermostat.com:8083`
- **Topics**: Device-specific MQTT topics for telemetry, attributes, and RPC commands
- **Caching**: Service worker caches network requests for offline operation

## Project Structure

```
src/
├── components/          # React components
│   ├── ThermostatHeader
│   ├── PowerControl
│   ├── TemperatureSlider
│   ├── ModeSelector
│   ├── FanSelector
│   └── SettingsSummary
├── hooks/              # Custom React hooks
│   ├── useThermostatStore   # State management
│   └── useMqttClient        # MQTT communication
├── styles/             # Global styles with CSS variables
├── types.ts            # TypeScript types
├── App.tsx             # Main App component
└── main.tsx            # React entry point
public/                # Static assets (icons, manifest)
dist/                  # Production build output
```

## Conversion from Svelte

This app was successfully converted from SvelteKit to React with the following improvements:
- **Better ecosystem compatibility** with more libraries and tools
- **Larger community** for support and resources
- **Same functionality** preserved with React hooks
- **Enhanced PWA** with proper service worker and manifest configuration

## License

MIT

