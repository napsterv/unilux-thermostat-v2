import { ThermostatState } from '@/types';
import './SettingsSummary.css';

interface SettingsSummaryProps {
	state: ThermostatState;
}

export function SettingsSummary({ state }: SettingsSummaryProps) {
	return (
		<div className="card settings-summary">
			<h3>Settings</h3>
			<div className="settings-grid">
				<div className="setting-item">
					<span className="label">Unit</span>
					<span className="value">{state.tempUnit}</span>
				</div>
				<div className="setting-item">
					<span className="label">Format</span>
					<span className="value">{state.timeFormat}</span>
				</div>
				<div className="setting-item">
					<span className="label">Vacation</span>
					<span className="value">{state.vacationHold > 0 ? 'On' : 'Off'}</span>
				</div>
				<div className="setting-item">
					<span className="label">Diff (H/C)</span>
					<span className="value">
						{state.switchingDiffHeating}/{state.switchingDiffCooling}
					</span>
				</div>
			</div>
		</div>
	);
}
