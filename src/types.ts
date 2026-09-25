export interface ThermostatState {
	controlMode: 'On' | 'Off';
	spValue: number;
	mainMode: string;
	fanMode: 'Off' | 'Low' | 'Med' | 'High';
	tempUnit: string;
	timeFormat: string;
	vacationHold: number;
	internalOffset: number;
	switchingDiffHeating: number;
	switchingDiffCooling: number;
	forceVent: boolean;
	changeOverMode: 'Heat' | 'Cool' | 'Auto';
	changeOverTempHeating: number;
	changeOverTempCooling: number;
}

export const MIN_TEMP = 5;
export const MAX_TEMP = 40;
export const STEP = 0.5;
