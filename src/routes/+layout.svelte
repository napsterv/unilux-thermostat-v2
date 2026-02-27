<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../routes/styles/thermostat.css';

	let { children } = $props();
	const appVersion = import.meta.env.APP_VERSION;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	{@render children()}

	<footer class="footer">
		<div>Made with <span class="heart">❤️</span> in Toronto, Canada</div>
		<div class="version">App Version: v{appVersion}</div>
	</footer>
</div>

<style>
	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.footer {
		text-align: center;
		padding: 24px;
		font-size: 0.8rem;
		color: var(--text-muted, #64748b);
		margin-top: auto;
		opacity: 0.8;
		letter-spacing: 0.05em;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.version {
		font-size: 0.7rem;
		opacity: 0.6;
	}
</style>
