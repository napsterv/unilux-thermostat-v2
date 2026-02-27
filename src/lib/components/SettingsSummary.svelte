<script lang="ts">
	import type { ThermostatState } from '$lib/stores/thermostat.svelte';

	interface Props {
		state: ThermostatState;
	}

	let { state }: Props = $props();
</script>

<div class="card settings-summary">
	<h3>Settings</h3>
	<div class="settings-grid">
		<div class="setting-item">
			<span class="label">Unit</span>
			<span class="value">{state.tempUnit}</span>
		</div>
		<div class="setting-item">
			<span class="label">Format</span>
			<span class="value">{state.timeFormat}</span>
		</div>
		<div class="setting-item">
			<span class="label">Vacation</span>
			<span class="value">{state.vacationHold > 0 ? 'On' : 'Off'}</span>
		</div>
		<div class="setting-item">
			<span class="label">Diff (H/C)</span>
			<span class="value">{state.switchingDiffHeating}/{state.switchingDiffCooling}</span>
		</div>
	</div>
</div>

<style>
	.card {
		background: var(--card-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--border-color);
		border-radius: 24px;
		padding: 12px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin: 0 0 16px 0;
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
</style>
