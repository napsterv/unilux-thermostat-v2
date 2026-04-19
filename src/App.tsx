import { useEffect } from 'react';
import { useThermostatStore } from '@/hooks/useThermostatStore';
import { useMqttClient } from '@/hooks/useMqttClient';
import { MAX_TEMP, MIN_TEMP } from '@/types';
import { ThermostatHeader } from '@/components/ThermostatHeader';
import { PowerControl } from '@/components/PowerControl';
import { TemperatureSlider } from '@/components/TemperatureSlider';
import { ModeSelector } from '@/components/ModeSelector';
import { FanSelector } from '@/components/FanSelector';
import './App.css';

const APP_VERSION = import.meta.env.APP_VERSION || '0.2.0';

function App() {
	const thermostatStore = useThermostatStore();
	const mqttClient = useMqttClient(
		thermostatStore.updateState,
		thermostatStore.updateRoomTemp
	);

	useEffect(() => {
		let storedDeviceId = localStorage.getItem('deviceId');
		if (!storedDeviceId) {
			storedDeviceId = prompt('Please enter your Device ID:');
			if (storedDeviceId) {
				localStorage.setItem('deviceId', storedDeviceId);
			}
		}

		if (storedDeviceId) {
			console.log(`Using Device ID: ${storedDeviceId}`);
			mqttClient.connect(storedDeviceId);
		}

		return () => {
			mqttClient.disconnect();
		};
	}, []);

	const handleSliderChange = (value: number) => {
		mqttClient.setSpValue(value);
	};

	const handleAdjustTemp = (delta: number) => {
		const newTemp = thermostatStore.state.spValue + delta;
		mqttClient.setSpValue(Math.min(MAX_TEMP, Math.max(MIN_TEMP, newTemp)));
	};

	const handleTogglePower = () => {
		const newMode = thermostatStore.state.controlMode === 'On' ? 'Off' : 'On';
		thermostatStore.updateState({ controlMode: newMode });
		mqttClient.togglePower();
	};

	const storedDeviceId = localStorage.getItem('deviceId');

	return (
		<div className="app-container">
			<main className="container">
				<ThermostatHeader />

				<div className="connection-status-row">
					<div className={`status-banner ${mqttClient.isConnected ? 'connected' : ''}`}>
						{mqttClient.isConnected ? 'Connected' : 'Disconnected'}
					</div>

					{storedDeviceId && (
						<div className="device-id-display">
							ID: <span>{storedDeviceId}</span>
						</div>
					)}
				</div>

				<section className="card thermostat-main">
					<PowerControl
						controlMode={thermostatStore.state.controlMode}
						onToggle={handleTogglePower}
					/>

					<TemperatureSlider
						spValue={thermostatStore.state.spValue}
						roomTemp={thermostatStore.roomTemp}
						ratio={thermostatStore.ratio}
						controlMode={thermostatStore.state.controlMode}
						changeOverMode={thermostatStore.state.changeOverMode}
						onSliderChange={handleSliderChange}
						onAdjust={handleAdjustTemp}
					/>
				</section>

				<section className="controls-grid">
					<ModeSelector
						changeOverMode={thermostatStore.state.changeOverMode}
						controlMode={thermostatStore.state.controlMode}
						onModeChange={mqttClient.setChangeOverMode}
					/>

					<FanSelector
						fanMode={thermostatStore.state.fanMode}
						controlMode={thermostatStore.state.controlMode}
						onFanChange={mqttClient.setFanMode}
					/>
				</section>
			</main>

			<footer className="footer">
				<div>Made with <span className="heart">❤️</span> in Toronto, Canada</div>
				<div className="version">App Version: v{APP_VERSION}</div>
			</footer>
		</div>
	);
}

export default App;
