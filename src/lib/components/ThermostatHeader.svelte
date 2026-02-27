<script lang="ts">
	import { onMount } from 'svelte';

	let isDarkMode = $state(true);

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (typeof document !== 'undefined') {
			const mode = isDarkMode ? 'dark' : 'light';
			localStorage.setItem('theme', mode);
			document.documentElement.classList.toggle('light-mode', !isDarkMode);
		}
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			isDarkMode = savedTheme === 'dark';
			if (typeof document !== 'undefined') {
				document.documentElement.classList.toggle('light-mode', !isDarkMode);
			}
		}
	});
</script>

<header>
	<h1>Unilux Thermostat V2</h1>
	<button class="theme-toggle" onclick={toggleDarkMode} aria-label="Toggle Dark Mode">
		{isDarkMode ? '🌙' : '☀️'}
	</button>
</header>

<style>
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
		background-clip: text;
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
</style>
