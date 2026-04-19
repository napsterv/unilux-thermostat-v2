import { useEffect, useState } from 'react';
import './ThermostatHeader.css';

export function ThermostatHeader() {
	const [isDarkMode, setIsDarkMode] = useState(true);

	useEffect(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			const isDark = savedTheme === 'dark';
			setIsDarkMode(isDark);
			document.documentElement.classList.toggle('light-mode', !isDark);
		}
	}, []);

	const toggleDarkMode = () => {
		const newIsDark = !isDarkMode;
		setIsDarkMode(newIsDark);
		const mode = newIsDark ? 'dark' : 'light';
		localStorage.setItem('theme', mode);
		document.documentElement.classList.toggle('light-mode', !newIsDark);
	};

	return (
		<header>
			<h1>Unilux Thermostat V2</h1>
			<button 
				className="theme-toggle" 
				onClick={toggleDarkMode}
				aria-label="Toggle Dark Mode"
			>
				{isDarkMode ? '🌙' : '☀️'}
			</button>
		</header>
	);
}
