import { MIN_TEMP, MAX_TEMP, STEP } from '@/types';
import './TemperatureSlider.css';

interface TemperatureSliderProps {
	spValue: number;
	roomTemp: number;
	ratio: number;
	controlMode: 'On' | 'Off';
	changeOverMode: 'Heat' | 'Cool' | 'Auto';
	onSliderChange: (value: number) => void;
	onAdjust: (delta: number) => void;
}

export function TemperatureSlider({
	spValue,
	roomTemp,
	ratio,
	controlMode,
	changeOverMode,
	onSliderChange,
	onAdjust
}: TemperatureSliderProps) {
	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = parseFloat(e.target.value);
		if (newValue !== spValue) {
			onSliderChange(newValue);
		}
	};

	return (
		<div className="temp-slider">
			<div className="temp-display-large">
				<div className="room-temp">Room {roomTemp.toFixed(1)}°</div>
				<div className="current-temp">{spValue.toFixed(1)}°</div>
			</div>

			<div className="slider-container">
				<input
					type="range"
					min={MIN_TEMP}
					max={MAX_TEMP}
					step={STEP}
					value={spValue}
					onChange={handleSliderChange}
					disabled={controlMode !== 'On'}
					className="horizontal-slider"
				/>
				<div
					className={`slider-track-fill ${changeOverMode === 'Heat' ? 'heat' : ''} ${changeOverMode === 'Cool' ? 'cool' : ''}`}
					style={{ width: `${ratio * 100}%` }}
				></div>
			</div>

			<div className="temp-controls">
				<button
					disabled={controlMode !== 'On'}
					onClick={() => onAdjust(-0.5)}
					aria-label="Decrease Temperature"
				>
					−
				</button>
				<button
					disabled={controlMode !== 'On'}
					onClick={() => onAdjust(0.5)}
					aria-label="Increase Temperature"
				>
					+
				</button>
			</div>
		</div>
	);
}
