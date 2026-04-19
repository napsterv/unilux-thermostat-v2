import { useState, useCallback } from 'react';
import { ThermostatState, MIN_TEMP, MAX_TEMP } from '@/types';

export function useThermostatStore() {
	const [state, setState] = useState<ThermostatState>({
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

	const [roomTemp, setRoomTemp] = useState(0);

	const updateState = useCallback((update: Partial<ThermostatState>) => {
		setState(prev => ({ ...prev, ...update }));
	}, []);

	const updateRoomTemp = useCallback((temp: number) => {
		setRoomTemp(temp);
	}, []);

	const ratio = (state.spValue - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);

	return {
		state,
		roomTemp,
		ratio,
		updateState,
		updateRoomTemp
	};
}
