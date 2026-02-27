export interface ThermostatState {
	controlMode: 'On' | 'Off';
	spValue: number;
	mainMode: string;
	fanMode: 'Auto' | 'Off' | 'Low' | 'Med' | 'High';
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

export function createThermostatStore() {
	let state = $state<ThermostatState>({
		controlMode: 'Off',
		spValue: 20,
		mainMode: '2P',
		fanMode: 'Low',
		tempUnit: '°C',
		timeFormat: '12hours',
		vacationHold: 0,
		internalOffset: 0,
		switchingDiffHeating: 2,
		switchingDiffCooling: 2,
		forceVent: false,
		changeOverMode: 'Auto',
		changeOverTempHeating: 18,
		changeOverTempCooling: 23
	});

	let roomTemp = $state(0);

	return {
		get state() {
			return state;
		},
		get roomTemp() {
			return roomTemp;
		},
		get ratio() {
			return (state.spValue - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
		},
		updateState(update: Partial<ThermostatState>) {
			state = { ...state, ...update };
		},
		updateRoomTemp(temp: number) {
			roomTemp = temp;
		}
	};
}

export type ThermostatStore = ReturnType<typeof createThermostatStore>;
