<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	{@render children()}

	<footer class="footer">
		Made with <span class="heart">❤️</span> in Toronto, Canada
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
	}
</style>
