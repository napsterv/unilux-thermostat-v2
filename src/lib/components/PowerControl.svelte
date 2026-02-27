<script lang="ts">
	interface Props {
		controlMode: 'On' | 'Off';
		onToggle: () => void;
	}

	let { controlMode, onToggle }: Props = $props();
</script>

<div class="power-control">
	<button class="power-btn" class:on={controlMode === 'On'} onclick={onToggle}>
		<span class="power-icon">⏻</span>
		{controlMode === 'On' ? 'Power On' : 'Power Off'}
	</button>
</div>

<style>
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
</style>
