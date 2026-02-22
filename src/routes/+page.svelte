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
		spValue: 0,
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

	const MQTT_BROKER = 'wss://mqapi.uniluxthermostat.com:8083';
	
	function getTopicResponse(id: string) { return `${id}/v1/devices/me/rpc/response/0`; }
	function getTopicAttributes(id: string) { return `${id}/v1/devices/me/attributes`; }
	function getTopicTelemetry(id: string) { return `${id}/v1/devices/me/telemetry`; }
	function getTopicRequest(id: string) { return `${id}/v1/devices/me/rpc/request/`; }

	const MIN_TEMP = 5;
	const MAX_TEMP = 40;
	const STEP = 0.5;
	
	let angleRad = $derived((180 - (thermostatState.spValue - MIN_TEMP) / (MAX_TEMP - MIN_TEMP) * 180) * (Math.PI / 180));

	let isDragging = $state(false);

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
		const centerY = rect.bottom; // Semi-circle bottom center

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
		client?.end();
	});

	function publishUpdate(update: Partial<typeof thermostatState>) {
		if (client && isConnected && deviceId) {
			const newState = { ...thermostatState, ...update };
			client.publish(getTopicRequest(deviceId), JSON.stringify(newState));
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
				{thermostatState.controlMode === 'On' ? 'Power On' : 'Power Off'}
			</button>
		</div>

		<div class="temp-slider">
			<svg viewBox="0 0 200 110" 
				onmousedown={handleMouseDown}
				ontouchmove={handleTouchMove}
				class:disabled={thermostatState.controlMode !== 'On'}>
				<!-- Background Track -->
				<path d="M 20 100 A 80 80 0 0 1 180 100" 
					fill="none" 
					stroke="#eee" 
					stroke-width="12" 
					stroke-linecap="round" />
				
				<!-- Active Track -->
				<path d="M 20 100 A 80 80 0 0 1 {100 + 80 * Math.cos(angleRad)} {100 - 80 * Math.sin(angleRad)}" 
					class="active-path"
					fill="none" 
					stroke="#1890ff" 
					stroke-width="12" 
					stroke-linecap="round" />

				<!-- Thumb -->
				<circle 
					cx={100 + 80 * Math.cos(angleRad)} 
					cy={100 - 80 * Math.sin(angleRad)} 
					r="10" 
					fill="white" 
					stroke="#1890ff" 
					stroke-width="3" />
			</svg>
			
			<div class="temp-display-large">
				<div class="room-temp">Room: {roomTemp.toFixed(1)}°C</div>
				<div class="current-temp">{thermostatState.spValue.toFixed(1)}°C</div>
			</div>

			<div class="temp-controls">
				<button disabled={thermostatState.controlMode !== 'On'} onclick={() => adjustTemperature(-0.5)}>-</button>
				<button disabled={thermostatState.controlMode !== 'On'} onclick={() => adjustTemperature(0.5)}>+</button>
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
	</section>
</main>

<style>
	:global(body) {
		background-color: #f0f2f5;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		margin: 0;
		color: #333;
	}

	.container {
		max-width: 500px;
		margin: 0 auto;
		padding: 20px;
	}

	header {
		text-align: center;
		margin-bottom: 10px;
	}

	h1 {
		margin: 0;
		font-size: 1.2rem;
		color: #666;
	}

	.status-banner {
		text-align: center;
		font-size: 1.2rem;
		font-weight: bold;
		padding: 12px;
		border-radius: 8px;
		background: #ff4d4f;
		color: white;
		margin-bottom: 20px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		transition: all 0.3s;
	}

	.status-banner.connected {
		background: #52c41a;
	}

	.device-id-display {
		text-align: center;
		font-size: 0.9rem;
		color: #888;
		margin-top: -10px;
		margin-bottom: 20px;
	}

	.device-id-display span {
		font-weight: 500;
		color: #555;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		margin-bottom: 20px;
	}

	.thermostat-main {
		text-align: center;
	}

	.power-btn {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 8px;
		background: #d9d9d9;
		color: #555;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s;
	}

	.power-btn.on {
		background: #1890ff;
		color: white;
	}

	.temp-slider {
		position: relative;
		margin: 20px 0;
		user-select: none;
	}

	.temp-slider svg {
		width: 100%;
		max-width: 300px;
		height: auto;
		cursor: pointer;
	}

	.temp-slider svg.disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.active-path {
		transition: stroke-dasharray 0.1s ease-out;
	}

	.temp-display-large {
		position: absolute;
		bottom: 50px;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.room-temp {
		font-size: 1.1rem;
		color: #888;
		margin-bottom: 2px;
	}

	.current-temp {
		font-size: 3.5rem;
		font-weight: bold;
		line-height: 1;
	}

	.temp-controls {
		display: flex;
		justify-content: center;
		gap: 125px;
		margin-top: 15px;
	}

	.temp-controls button {
		width: 50px;
		height: 50px;
		border-radius: 25px;
		border: 1px solid #d9d9d9;
		background: white;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.btn-group {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.btn-group button {
		flex: 1;
		min-width: 80px;
		padding: 8px;
		border: 1px solid #d9d9d9;
		background: white;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-group button.active {
		background: #1890ff;
		color: white;
		border-color: #1890ff;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
