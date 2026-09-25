import './ModeSelector.css';

interface ModeSelectorProps {
	changeOverMode: 'Heat' | 'Cool' | 'Auto';
	controlMode: 'On' | 'Off';
	onModeChange: (mode: string) => void;
}

export function ModeSelector({
	changeOverMode,
	controlMode,
	onModeChange
}: ModeSelectorProps) {
	const modes = ['Auto', 'Heat', 'Cool'] as const;
	const currentIndex = modes.indexOf(changeOverMode as typeof modes[number]);

	const handleModeChange = () => {
		if (controlMode !== 'On') return;
		const nextIndex = (currentIndex + 1) % modes.length;
		onModeChange(modes[nextIndex]);
	};

	const getModeIcon = (mode: string) => {
		switch (mode) {
			case 'Heat': return '🔥';
			case 'Cool': return '❄️';
			case 'Auto': return '🔄';
			default: return '🌡️';
		}
	};

	return (
		<div className="card mode-select">
			<h3>
				<span className="icon">🌡️</span> Mode
			</h3>
			<div className="mode-control">
				<button
					disabled={controlMode !== 'On'}
					className="mode-btn"
					onClick={handleModeChange}
					title="Cycle mode"
				>
					<span className="icon">{getModeIcon(changeOverMode)}</span>
					<span className="mode-text">{changeOverMode.toUpperCase()}</span>
				</button>
			</div>
		</div>
	);
}
