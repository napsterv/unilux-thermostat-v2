<script lang="ts">
	interface Props {
		changeOverMode: 'Heat' | 'Cool' | 'Auto';
		controlMode: 'On' | 'Off';
		onModeChange: (mode: string) => void;
	}

	let { changeOverMode, controlMode, onModeChange }: Props = $props();
</script>

<div class="card mode-select">
	<h3><span class="icon">🌡️</span> Mode</h3>
	<div class="btn-group">
		<button
			disabled={controlMode !== 'On'}
			class:active={changeOverMode === 'Heat'}
			onclick={() => onModeChange('Heat')}><span class="icon">🔥</span> HEAT</button
		>
		<button
			disabled={controlMode !== 'On'}
			class:active={changeOverMode === 'Cool'}
			onclick={() => onModeChange('Cool')}><span class="icon">❄️</span> COOL</button
		>
		<button
			disabled={controlMode !== 'On'}
			class:active={changeOverMode === 'Auto'}
			onclick={() => onModeChange('Auto')}><span class="icon">🔄</span> AUTO</button
		>
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
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon {
		font-size: 1rem;
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

	button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
