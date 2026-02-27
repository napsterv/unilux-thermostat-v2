<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Thermostat } from '$lib/thermostat.svelte';
	import './page.css';

	const thermostat = new Thermostat();

	onMount(() => {
		thermostat.init();
	});

	onDestroy(() => {
		thermostat.destroy();
	});
</script>

<svelte:head>
	<title>Unilux Thermostat V2</title>
</svelte:head>

<main class="container">
	<header>
		<h1>Unilux Thermostat V2</h1>
		<button class="theme-toggle" onclick={thermostat.toggleDarkMode} aria-label="Toggle Dark Mode">
			{thermostat.isDarkMode ? '🌙' : '☀️'}
		</button>
	</header>

	<div class="status-banner" class:connected={thermostat.isConnected}>
		{thermostat.isConnected ? 'Connected' : 'Disconnected'}
	</div>

	{#if thermostat.deviceId}
		<div class="device-id-display">
			Device ID: <span>{thermostat.deviceId}</span>
		</div>
	{/if}

	<section class="card thermostat-main">
		<div class="power-control">
			<button class="power-btn" class:on={thermostat.thermostatState.controlMode === 'On'} onclick={thermostat.togglePower}>
				<span class="power-icon">⏻</span>
				{thermostat.thermostatState.controlMode === 'On' ? 'Power On' : 'Power Off'}
			</button>
		</div>

		<div class="temp-slider">
			<div class="temp-display-large">
				<div class="room-temp">Room {thermostat.roomTemp.toFixed(1)}°</div>
				<div class="current-temp">{thermostat.thermostatState.spValue.toFixed(1)}°</div>
			</div>

			<div class="slider-container">
				<input 
					type="range" 
					min={thermostat.MIN_TEMP} 
					max={thermostat.MAX_TEMP} 
					step={thermostat.STEP} 
					value={thermostat.thermostatState.spValue}
					oninput={thermostat.handleSliderChange}
					disabled={thermostat.thermostatState.controlMode !== 'On'}
					class="horizontal-slider"
				/>
				<div class="slider-track-fill" 
					class:heat={thermostat.thermostatState.changeOverMode === 'Heat'}
					class:cool={thermostat.thermostatState.changeOverMode === 'Cool'}
					style="width: {thermostat.ratio * 100}%"
				></div>
			</div>
			
			<div class="temp-controls">
				<button disabled={thermostat.thermostatState.controlMode !== 'On'} onclick={() => thermostat.adjustTemperature(-0.5)} aria-label="Decrease Temperature">−</button>
				<button disabled={thermostat.thermostatState.controlMode !== 'On'} onclick={() => thermostat.adjustTemperature(0.5)} aria-label="Increase Temperature">+</button>
			</div>
		</div>
	</section>

	<section class="controls-grid">
		<div class="card mode-select">
			<h3><span class="icon">🌡️</span> Mode</h3>
			<div class="btn-group">
				<button 
					disabled={thermostat.thermostatState.controlMode !== 'On'} 
					class:active={thermostat.thermostatState.changeOverMode === 'Heat'} 
					onclick={() => thermostat.setChangeOverMode('Heat')}><span class="icon">🔥</span> HEAT</button>
				<button 
					disabled={thermostat.thermostatState.controlMode !== 'On'} 
					class:active={thermostat.thermostatState.changeOverMode === 'Cool'} 
					onclick={() => thermostat.setChangeOverMode('Cool')}><span class="icon">❄️</span> COOL</button>
				<button 
					disabled={thermostat.thermostatState.controlMode !== 'On'} 
					class:active={thermostat.thermostatState.changeOverMode === 'Auto'} 
					onclick={() => thermostat.setChangeOverMode('Auto')}><span class="icon">🔄</span> AUTO</button>
			</div>
		</div>

		<div class="card fan-select">
			<h3><span class="icon">🌀</span> Fan</h3>
			<div class="btn-group">
				{#each ['Auto', 'Off', 'Low', 'Med', 'High'] as label}
					<button 
						disabled={thermostat.thermostatState.controlMode !== 'On'} 
						class:active={thermostat.thermostatState.fanMode === label} 
						onclick={() => thermostat.setFan(label)}>
						{label.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>

		<div class="card settings-summary">
			<h3>Settings</h3>
			<div class="settings-grid">
				<div class="setting-item">
					<span class="label">Unit</span>
					<span class="value">{thermostat.thermostatState.tempUnit}</span>
				</div>
				<div class="setting-item">
					<span class="label">Format</span>
					<span class="value">{thermostat.thermostatState.timeFormat}</span>
				</div>
				<div class="setting-item">
					<span class="label">Vacation</span>
					<span class="value">{thermostat.thermostatState.vacationHold > 0 ? 'On' : 'Off'}</span>
				</div>
				<div class="setting-item">
					<span class="label">Diff (H/C)</span>
					<span class="value">{thermostat.thermostatState.switchingDiffHeating}/{thermostat.thermostatState.switchingDiffCooling}</span>
				</div>
			</div>
		</div>
	</section>
</main>
