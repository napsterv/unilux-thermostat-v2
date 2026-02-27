<script lang="ts">
	import { MIN_TEMP, MAX_TEMP, STEP } from '$lib/stores/thermostat.svelte';

	interface Props {
		spValue: number;
		roomTemp: number;
		ratio: number;
		controlMode: 'On' | 'Off';
		changeOverMode: 'Heat' | 'Cool' | 'Auto';
		onSliderChange: (value: number) => void;
		onAdjust: (delta: number) => void;
	}

	let { spValue, roomTemp, ratio, controlMode, changeOverMode, onSliderChange, onAdjust }: Props =
		$props();

	function handleSliderChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		if (newValue !== spValue) {
			onSliderChange(newValue);
		}
	}
</script>

<div class="temp-slider">
	<div class="temp-display-large">
		<div class="room-temp">Room {roomTemp.toFixed(1)}°</div>
		<div class="current-temp">{spValue.toFixed(1)}°</div>
	</div>

	<div class="slider-container">
		<input
			type="range"
			min={MIN_TEMP}
			max={MAX_TEMP}
			step={STEP}
			value={spValue}
			oninput={handleSliderChange}
			disabled={controlMode !== 'On'}
			class="horizontal-slider"
		/>
		<div
			class="slider-track-fill"
			class:heat={changeOverMode === 'Heat'}
			class:cool={changeOverMode === 'Cool'}
			style="width: {ratio * 100}%"
		></div>
	</div>

	<div class="temp-controls">
		<button
			disabled={controlMode !== 'On'}
			onclick={() => onAdjust(-0.5)}
			aria-label="Decrease Temperature">−</button
		>
		<button
			disabled={controlMode !== 'On'}
			onclick={() => onAdjust(0.5)}
			aria-label="Increase Temperature">+</button
		>
	</div>
</div>

<style>
	.temp-slider {
		position: relative;
		margin: 20px 0;
		padding: 20px 0;
		user-select: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}

	.temp-display-large {
		pointer-events: none;
	}

	.slider-container {
		position: relative;
		width: 100%;
		max-width: 320px;
		height: 40px;
		display: flex;
		align-items: center;
	}

	.horizontal-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 12px;
		background: var(--track-bg);
		border-radius: 6px;
		outline: none;
		cursor: pointer;
		position: relative;
		z-index: 2;
	}

	.horizontal-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: white;
		border: 3px solid #3b82f6;
		cursor: pointer;
		box-shadow: 0 0 15px var(--accent-glow);
		transition: all 0.2s;
	}

	.horizontal-slider:disabled {
		cursor: not-allowed;
		opacity: 0.3;
	}

	.slider-track-fill {
		position: absolute;
		left: 0;
		height: 12px;
		background: linear-gradient(90deg, #00f2fe, #3b82f6);
		border-radius: 6px;
		z-index: 1;
		pointer-events: none;
		transition: background 0.3s ease;
	}

	.slider-track-fill.heat {
		background: linear-gradient(90deg, #ffedd5, #ea580c);
	}

	.slider-track-fill.cool {
		background: linear-gradient(90deg, #1e3a8a, #93c5fd);
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
		margin: 1px auto 0;
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

	button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	@media (max-width: 400px) {
		.current-temp {
			font-size: 3rem;
		}
	}
</style>
