<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createThermostatStore, MIN_TEMP, MAX_TEMP } from '$lib/stores/thermostat.svelte';
	import { createMqttClient } from '$lib/services/mqtt-client.svelte';
	import ThermostatHeader from '$lib/components/ThermostatHeader.svelte';
	import PowerControl from '$lib/components/PowerControl.svelte';
	import TemperatureSlider from '$lib/components/TemperatureSlider.svelte';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import FanSelector from '$lib/components/FanSelector.svelte';
	import SettingsSummary from '$lib/components/SettingsSummary.svelte';

	let deviceId = $state('');
	const thermostatStore = createThermostatStore();
	const mqttClient = createMqttClient(thermostatStore);

	onMount(() => {
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
			mqttClient.connect(deviceId);
		}
	});

	onDestroy(() => {
		mqttClient.disconnect();
	});

	function handleSliderChange(value: number) {
		mqttClient.setSpValue(value);
	}

	function handleAdjustTemp(delta: number) {
		const newTemp = thermostatStore.state.spValue + delta;
		mqttClient.setSpValue(Math.min(MAX_TEMP, Math.max(MIN_TEMP, newTemp)));
	}
</script>

<svelte:head>
	<title>Unilux Thermostat V2</title>
</svelte:head>

<main class="container">
	<ThermostatHeader />

	<div class="connection-status-row">
		<div class="status-banner" class:connected={mqttClient.isConnected}>
			{mqttClient.isConnected ? 'Connected' : 'Disconnected'}
		</div>

		{#if deviceId}
			<div class="device-id-display">
				ID: <span>{deviceId}</span>
			</div>
		{/if}
	</div>

	<section class="card thermostat-main">
		<PowerControl controlMode={thermostatStore.state.controlMode} onToggle={mqttClient.togglePower} />

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

	<section class="controls-grid">
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

		<SettingsSummary state={thermostatStore.state} />
	</section>
</main>

<style>
	.container {
		max-width: 480px;
		margin: 0 auto;
		padding: 24px;
	}

	.connection-status-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 24px;
	}

	.status-banner {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 20px;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
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
		font-size: 0.75rem;
		color: var(--text-muted);
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
		padding: 12px;
		margin-bottom: 24px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.thermostat-main {
		text-align: center;
		background: var(--card-bg-alt);
	}

	.controls-grid {
		display: grid;
		gap: 24px;
	}

	@media (max-width: 400px) {
		.container {
			padding: 16px;
		}
	}
</style>
