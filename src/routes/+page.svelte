<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import mqtt from 'mqtt';

	let client: mqtt.MqttClient | null = $state(null);
	let isConnected = $state(false);
	let deviceId = $state('');
	let roomTemp = $state(0);
	let clientId = `uni_${Math.random().toString(16).slice(2)}`;
	
	let thermostatState = $state({
		controlMode: 'Off', // On, Off
		spValue: 20,
		mainMode: '2P', 
		fanMode: 'Low', // Auto, Low, Medium, High
		tempUnit: '°C',
		timeFormat: '12hours',
		vacationHold: 0,
		internalOffset: 0,
		switchingDiffHeating: 2,
		switchingDiffCooling: 2,
		forceVent: false,
		changeOverMode: 'Auto', // Heat, Cool, Auto
		changeOverTempHeating: 18,
		changeOverTempCooling: 23
	});

	const MQTT_BROKER = 'ws://mqapi.uniluxthermostat.com:8083';

	function getTopicResponse(id: string) { return `${id}/v1/devices/me/rpc/response/0`; }
	function getTopicAttributes(id: string) { return `${id}/v1/devices/me/attributes`; }
	function getTopicTelemetry(id: string) { return `${id}/v1/devices/me/telemetry`; }
	function getTopicRequest(id: string) { return `${id}/v1/devices/me/rpc/request/`; }

	const MIN_TEMP = 5;
	const MAX_TEMP = 40;
	const STEP = 0.5;
	
	let angleRad = $derived((180 - (thermostatState.spValue - MIN_TEMP) / (MAX_TEMP - MIN_TEMP) * 180) * (Math.PI / 180));
	let ratio = $derived((thermostatState.spValue - MIN_TEMP) / (MAX_TEMP - MIN_TEMP));

	let isDragging = $state(false);
	let isDarkMode = $state(true);
	let spValueTimeout: ReturnType<typeof setTimeout> | null = null;

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('light-mode', !isDarkMode);
		}
	}

	function updateTempFromAngle(angle: number) {
		// angle from 0 to 180 (semi-circle)
		// normalize 0..180 to MIN_TEMP..MAX_TEMP
		const normalized = angle / 180;
		const rawTemp = MIN_TEMP + normalized * (MAX_TEMP - MIN_TEMP);
		const steppedTemp = Math.round(rawTemp / STEP) * STEP;
		
		if (steppedTemp !== thermostatState.spValue) {
			publishUpdate({ spValue: Math.min(MAX_TEMP, Math.max(MIN_TEMP, steppedTemp)) });
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (thermostatState.controlMode !== 'On') return;
		isDragging = true;
		handleMove(e);
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			handleMove(e);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleTouchMove(e: TouchEvent) {
		if (thermostatState.controlMode !== 'On') return;
		handleMove(e.touches[0]);
	}

	function handleMove(e: { clientX: number, clientY: number }) {
		const svg = document.querySelector('.temp-slider svg');
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + (rect.height * 100 / 120); // Arc center at y=100 in 120-height viewBox

		const dx = e.clientX - centerX;
		const dy = e.clientY - centerY;

		// atan2 returns angle in radians from -PI to PI
		// We want 0..180 degrees from left to right (top semi-circle)
		let angle = Math.atan2(-dy, dx) * (180 / Math.PI);
		
		// Map atan2: 180 is left, 90 is top, 0 is right
		// We want: 0 is left, 90 is top, 180 is right
		angle = 180 - angle;

		if (angle < 0) {
			if (dx < 0) angle = 0;
			else angle = 180;
		}
		if (angle > 180) {
			if (dx < 0) angle = 0;
			else angle = 180;
		}

		updateTempFromAngle(angle);
	}

	onMount(() => {
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);

		let storedDeviceId = localStorage.getItem('deviceId');
		if (!storedDeviceId) {
			storedDeviceId = prompt('Please enter your Device ID:');
			if (storedDeviceId) {
				localStorage.setItem('deviceId', storedDeviceId);
			}
		}
		
		if (storedDeviceId) {
			console.log(`Using Device ID: ${storedDeviceId}`);
			deviceId = storedDeviceId;
			client = mqtt.connect(MQTT_BROKER, { clientId: clientId });

			client.on('connect', () => {
				client?.subscribe([
					getTopicResponse(deviceId),
					getTopicAttributes(deviceId),
					getTopicTelemetry(deviceId),
					getTopicRequest(deviceId)
				]);

				// Fire off initial requests
				client?.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteGetMenuSet" }));
				client?.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteGetAttributes" }));
				client?.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteGetTelemetry" }));
				client?.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteGetDeviceStatus" }));
			});

			client.on('message', (topic, message) => {
				isConnected = true;
				console.log('MQTT Message:', topic, message.toString());
				try {
					let data = JSON.parse(message.toString());
					
					if (topic === getTopicTelemetry(deviceId)) {
						if (data.roomTemp !== undefined) {
							roomTemp = data.roomTemp;
						}
					} else if (topic === getTopicAttributes(deviceId)) {
						if (data.fanStatus !== undefined) {
							thermostatState.fanMode = data.fanStatus;
						}
						thermostatState = { ...thermostatState, ...data };
					} else if (topic.startsWith(deviceId + '/v1/devices/me/rpc/response/')) {
						if (data.roomTemp !== undefined) {
							roomTemp = data.roomTemp;
						}
						if (data.fanStatus !== undefined) {
							thermostatState.fanMode = data.fanStatus;
						}
						thermostatState = { ...thermostatState, ...data };
					}
				} catch (e) {
					console.error('Failed to parse MQTT message', e);
				}
			});

			client.on('error', (err) => {
				console.error('MQTT Connection Error:', err);
				isConnected = false;
			});

			client.on('close', () => {
				isConnected = false;
			});
		}
	});

	onDestroy(() => {
		window.removeEventListener('mouseup', handleMouseUp);
		window.removeEventListener('mousemove', handleMouseMove);
		if (spValueTimeout) clearTimeout(spValueTimeout);
		client?.end();
	});

	function publishUpdate(update: Partial<typeof thermostatState>) {
		if (client && isConnected && deviceId) {
			const newState = { ...thermostatState, ...update };
			if (update.spValue !== undefined) {
				if (spValueTimeout) clearTimeout(spValueTimeout);
				spValueTimeout = setTimeout(() => {
					client?.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteSetSpValue", "params": update.spValue }));
				}, 1500);
			} else {
				client.publish(getTopicRequest(deviceId), JSON.stringify(newState));
			}
			// Optimistically update UI
			thermostatState = newState;
		}
	}

	function togglePower() {
		const newMode = thermostatState.controlMode === 'On' ? 'Off' : 'On';
		if (client && isConnected && deviceId) {
			client.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteSetControlMode", "params": newMode }));
			// Optimistically update UI
			thermostatState.controlMode = newMode;
		}
	}

	function adjustTemperature(delta: number) {
		const newTemp = thermostatState.spValue + delta;
		publishUpdate({ spValue: Math.min(MAX_TEMP, Math.max(MIN_TEMP, newTemp)) });
	}

	function setMode(mainMode: string) {
		publishUpdate({ mainMode });
	}

	function setChangeOverMode(changeOverMode: string) {
		if (client && isConnected && deviceId) {
			client.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteSetChangeOverMode", "params": changeOverMode }));
			thermostatState.changeOverMode = changeOverMode;
		}
	}

	function setFan(fanMode: string) {
		if (fanMode === 'Off') {
			if (client && isConnected && deviceId) {
				client.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteSetControlMode", "params": "Off" }));
				thermostatState.controlMode = 'Off';
			}
			return;
		}

		if (client && isConnected && deviceId) {
			client.publish(getTopicRequest(deviceId), JSON.stringify({ "method": "remoteSetFanMode", "params": fanMode }));
			thermostatState.fanMode = fanMode;
		}
	}
</script>

<svelte:head>
	<title>Unilux Thermostat</title>
</svelte:head>

<main class="container">
	<header>
		<h1>Unilux Thermostat</h1>
		<button class="theme-toggle" onclick={toggleDarkMode} aria-label="Toggle Dark Mode">
			{isDarkMode ? '🌙' : '☀️'}
		</button>
	</header>

	<div class="status-banner" class:connected={isConnected}>
		{isConnected ? 'Connected' : 'Disconnected'}
	</div>

	{#if deviceId}
		<div class="device-id-display">
			Device ID: <span>{deviceId}</span>
		</div>
	{/if}

	<section class="card thermostat-main">
		<div class="power-control">
			<button class="power-btn" class:on={thermostatState.controlMode === 'On'} onclick={togglePower}>
				<span class="power-icon">⏻</span>
				{thermostatState.controlMode === 'On' ? 'Power On' : 'Power Off'}
			</button>
		</div>

		<div class="temp-slider">
			<svg viewBox="0 0 200 120" 
				onmousedown={handleMouseDown}
				ontouchmove={handleTouchMove}
				class:disabled={thermostatState.controlMode !== 'On'}>
				<defs>
					<linearGradient id="activeGradient" x1="20" y1="100" x2="180" y2="100" gradientUnits="userSpaceOnUse">
						<stop offset="0%" stop-color="#00f2fe" />
						<stop offset="50%" stop-color="#3b82f6" />
						<stop offset="50%" stop-color="#fbbf24" />
						<stop offset="100%" stop-color="#ef4444" />
					</linearGradient>
					<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
						<feMerge>
							<feMergeNode in="coloredBlur"/>
							<feMergeNode in="SourceGraphic"/>
						</feMerge>
					</filter>
				</defs>
				
				<!-- Background Track -->
				<path d="M 20 100 A 80 80 0 0 1 180 100" 
					fill="none" 
					stroke="var(--track-bg)" 
					stroke-width="12" 
					stroke-linecap="round" />
				
				<!-- Active Track -->
				<path d="M 20 100 A 80 80 0 0 1 {100 + 80 * Math.cos(angleRad)} {100 - 80 * Math.sin(angleRad)}" 
					class="active-path"
					fill="none" 
					stroke="url(#activeGradient)" 
					stroke-width="12" 
					stroke-linecap="round"
					filter="url(#glow)" />

				<!-- Thumb -->
				<circle 
					cx={100 + 80 * Math.cos(angleRad)} 
					cy={100 - 80 * Math.sin(angleRad)} 
					r="12" 
					fill="white" 
					stroke={ratio < 0.5 ? '#3b82f6' : '#ef4444'} 
					stroke-width="3"
					filter="url(#glow)" />
			</svg>
			
			<div class="temp-display-large">
				<div class="room-temp">Room {roomTemp.toFixed(1)}°</div>
				<div class="current-temp">{thermostatState.spValue.toFixed(1)}°</div>
			</div>

			<div class="temp-controls">
				<button disabled={thermostatState.controlMode !== 'On'} onclick={() => adjustTemperature(-0.5)} aria-label="Decrease Temperature">−</button>
				<button disabled={thermostatState.controlMode !== 'On'} onclick={() => adjustTemperature(0.5)} aria-label="Increase Temperature">+</button>
			</div>
		</div>
	</section>

	<section class="controls-grid">
		<div class="card mode-select">
			<h3>Mode</h3>
			<div class="btn-group">
				<button 
					disabled={thermostatState.controlMode !== 'On'} 
					class:active={thermostatState.changeOverMode === 'Heat'} 
					onclick={() => setChangeOverMode('Heat')}>HEAT</button>
				<button 
					disabled={thermostatState.controlMode !== 'On'} 
					class:active={thermostatState.changeOverMode === 'Cool'} 
					onclick={() => setChangeOverMode('Cool')}>COOL</button>
				<button 
					disabled={thermostatState.controlMode !== 'On'} 
					class:active={thermostatState.changeOverMode === 'Auto'} 
					onclick={() => setChangeOverMode('Auto')}>AUTO</button>
			</div>
		</div>

		<div class="card fan-select">
			<h3>Fan</h3>
			<div class="btn-group">
				{#each ['Auto', 'Off', 'Low', 'Med', 'High'] as speed}
					<button 
						disabled={thermostatState.controlMode !== 'On'} 
						class:active={thermostatState.fanMode === speed} 
						onclick={() => setFan(speed)}>{speed.toUpperCase()}</button>
				{/each}
			</div>
		</div>

		<div class="card settings-summary">
			<h3>Settings</h3>
			<div class="settings-grid">
				<div class="setting-item">
					<span class="label">Unit</span>
					<span class="value">{thermostatState.tempUnit}</span>
				</div>
				<div class="setting-item">
					<span class="label">Format</span>
					<span class="value">{thermostatState.timeFormat}</span>
				</div>
				<div class="setting-item">
					<span class="label">Vacation</span>
					<span class="value">{thermostatState.vacationHold > 0 ? 'On' : 'Off'}</span>
				</div>
				<div class="setting-item">
					<span class="label">Diff (H/C)</span>
					<span class="value">{thermostatState.switchingDiffHeating}/{thermostatState.switchingDiffCooling}</span>
				</div>
			</div>
		</div>
	</section>
</main>

<style>
	:global(:root) {
		--bg-gradient: radial-gradient(circle at top, #1e293b, #0f172a);
		--text-main: #f8fafc;
		--text-muted: #64748b;
		--text-bright: #94a3b8;
		--card-bg: rgba(30, 41, 59, 0.5);
		--card-bg-alt: rgba(30, 41, 59, 0.7);
		--btn-bg: rgba(15, 23, 42, 0.4);
		--border-color: rgba(255, 255, 255, 0.05);
		--border-btn: rgba(255, 255, 255, 0.1);
		--accent-glow: rgba(59, 130, 246, 0.2);
		--heading-gradient: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
		--track-bg: rgba(255, 255, 255, 0.1);
	}

	:global(.light-mode) {
		--bg-gradient: radial-gradient(circle at top, #f1f5f9, #e2e8f0);
		--text-main: #0f172a;
		--text-muted: #64748b;
		--text-bright: #334155;
		--card-bg: rgba(255, 255, 255, 0.7);
		--card-bg-alt: rgba(255, 255, 255, 0.9);
		--btn-bg: rgba(255, 255, 255, 0.5);
		--border-color: rgba(15, 23, 42, 0.05);
		--border-btn: rgba(15, 23, 42, 0.1);
		--accent-glow: rgba(59, 130, 246, 0.1);
		--heading-gradient: linear-gradient(135deg, #1e293b 0%, #475569 100%);
		--track-bg: rgba(15, 23, 42, 0.1);
	}

	:global(body) {
		background: var(--bg-gradient);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		margin: 0;
		color: var(--text-main);
		min-height: 100vh;
		transition: background 0.3s ease, color 0.3s ease;
	}

	.container {
		max-width: 480px;
		margin: 0 auto;
		padding: 24px;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		background: var(--heading-gradient);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.theme-toggle {
		background: var(--btn-bg);
		border: 1px solid var(--border-btn);
		color: var(--text-main);
		width: 40px;
		height: 40px;
		border-radius: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		transition: all 0.2s;
	}

	.theme-toggle:hover {
		transform: scale(1.05);
		background: var(--card-bg-alt);
	}

	.status-banner {
		text-align: center;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 20px;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		margin-bottom: 24px;
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
		border: 1px solid rgba(239, 68, 68, 0.2);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-banner.connected {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.2);
	}

	.device-id-display {
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: -16px;
		margin-bottom: 24px;
	}

	.device-id-display span {
		font-weight: 600;
		color: var(--text-bright);
	}

	.card {
		background: var(--card-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.thermostat-main {
		text-align: center;
		background: var(--card-bg-alt);
	}

	.power-control {
		margin-bottom: 24px;
	}

	.power-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		padding: 14px;
		border: 1px solid var(--border-btn);
		border-radius: 16px;
		background: var(--btn-bg);
		color: var(--text-muted);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.power-icon {
		font-size: 1.2rem;
	}

	.power-btn.on {
		background: rgba(37, 99, 235, 0.2);
		color: #3b82f6;
		border-color: rgba(37, 99, 235, 0.3);
		box-shadow: 0 0 20px rgba(37, 99, 235, 0.1);
	}

	.temp-slider {
		position: relative;
		margin: 20px 0;
		user-select: none;
	}

	.temp-slider svg {
		width: 100%;
		max-width: 320px;
		height: auto;
		cursor: pointer;
	}

	.temp-slider svg.disabled {
		cursor: not-allowed;
		opacity: 0.3;
	}

	.active-path {
		transition: stroke-dasharray 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.temp-display-large {
		position: absolute;
		bottom: 60px;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.room-temp {
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.current-temp {
		font-size: 4rem;
		font-weight: 800;
		line-height: 1;
		color: var(--text-main);
		text-shadow: 0 0 30px var(--accent-glow);
	}

	.temp-controls {
		display: flex;
		justify-content: space-between;
		width: 80%;
		margin: 0 auto;
		margin-top: 10px;
	}

	.temp-controls button {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		border: 1px solid var(--border-btn);
		background: var(--btn-bg);
		color: var(--text-main);
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.temp-controls button:active {
		transform: scale(0.95);
		background: var(--card-bg-alt);
	}

	.controls-grid h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin: 0 0 16px 0;
	}

	.btn-group {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.btn-group button {
		flex: 1;
		min-width: 70px;
		padding: 10px;
		border: 1px solid var(--border-color);
		background: var(--btn-bg);
		color: var(--text-muted);
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.btn-group button.active {
		background: rgba(37, 99, 235, 0.2);
		color: #3b82f6;
		border-color: rgba(37, 99, 235, 0.3);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.setting-item .label {
		font-size: 0.65rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-item .value {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-bright);
	}

	button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	@media (max-width: 400px) {
		.container {
			padding: 16px;
		}
		.current-temp {
			font-size: 3rem;
		}
	}
</style>
