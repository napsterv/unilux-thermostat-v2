import './FanSelector.css';

interface FanSelectorProps {
	fanMode: 'Off' | 'Low' | 'Med' | 'High';
	controlMode: 'On' | 'Off';
	onFanChange: (mode: string) => void;
}

export function FanSelector({
	fanMode,
	controlMode,
	onFanChange
}: FanSelectorProps) {
	const fanModes = ['Off', 'Low', 'Med', 'High'] as const;
	
	const currentIndex = fanModes.indexOf(fanMode as typeof fanModes[number]);

	const handleIncrease = () => {
		if (currentIndex === fanModes.length - 1) return;
		onFanChange(fanModes[currentIndex + 1]);
	};

	const handleDecrease = () => {
		if (currentIndex === 0) return;
		onFanChange(fanModes[currentIndex - 1]);
	};

	return (
		<div className="card fan-select">
			<h3>
				<span className="icon">🌀</span> Fan
			</h3>

			<div className="fan-speed-control">
				<button
					className="fan-btn decrease-btn"
					disabled={controlMode !== 'On' || currentIndex === 0}
					onClick={handleDecrease}
					title="Decrease fan speed"
				>
					−
				</button>

				<div className="fan-level-display">
					<div className="fan-bars">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className={`bar ${i < Math.min(currentIndex + (currentIndex === 3 ? 1 : 0), 4) ? 'active' : ''}`}
							/>
						))}
					</div>
					<span className="level-text">{fanMode.toUpperCase()}</span>
				</div>

				<button
					className="fan-btn increase-btn"
					disabled={controlMode !== 'On' || currentIndex === fanModes.length - 1}
					onClick={handleIncrease}
					title="Increase fan speed"
				>
					+
				</button>
			</div>
		</div>
	);
}
