import './PowerControl.css';

interface PowerControlProps {
	controlMode: 'On' | 'Off';
	onToggle: () => void;
}

export function PowerControl({ controlMode, onToggle }: PowerControlProps) {
	return (
		<div className="power-control">
			<button
				className={`power-btn ${controlMode === 'On' ? 'on' : ''}`}
				onClick={onToggle}
			>
				<span className="power-icon">⏻</span>
				{controlMode === 'On' ? 'Power On' : 'Power Off'}
			</button>
		</div>
	);
}
