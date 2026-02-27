import mqtt from 'mqtt';
import type { ThermostatState, ThermostatStore } from '$lib/stores/thermostat.svelte';

const MQTT_BROKER = 'ws://mqapi.uniluxthermostat.com:8083';

function getTopicResponse(id: string) {
	return `${id}/v1/devices/me/rpc/response/0`;
}
function getTopicAttributes(id: string) {
	return `${id}/v1/devices/me/attributes`;
}
function getTopicTelemetry(id: string) {
	return `${id}/v1/devices/me/telemetry`;
}
function getTopicRequest(id: string) {
	return `${id}/v1/devices/me/rpc/request/`;
}

export interface MqttClientService {
	isConnected: boolean;
	connect: (deviceId: string) => void;
	disconnect: () => void;
	publishUpdate: (update: Partial<ThermostatState>) => void;
	togglePower: () => void;
	setChangeOverMode: (mode: string) => void;
	setFanMode: (mode: string) => void;
	setSpValue: (value: number) => void;
}

export function createMqttClient(thermostatStore: ThermostatStore): MqttClientService {
	let client: mqtt.MqttClient | null = null;
	let isConnected = $state(false);
	let deviceId = '';
	let spValueTimeout: ReturnType<typeof setTimeout> | null = null;
	const clientId = `uni_${Math.random().toString(16).slice(2)}`;

	function connect(devId: string) {
		deviceId = devId;
		client = mqtt.connect(MQTT_BROKER, { clientId });

		client.on('connect', () => {
			client?.subscribe([
				getTopicResponse(deviceId),
				getTopicAttributes(deviceId),
				getTopicTelemetry(deviceId),
				getTopicRequest(deviceId)
			]);

			// Fire off initial requests
			client?.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetMenuSet' })
			);
			client?.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetAttributes' })
			);
			client?.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetTelemetry' })
			);
			client?.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetDeviceStatus' })
			);
		});

		client.on('message', (topic, message) => {
			isConnected = true;
			console.log('MQTT Message:', topic, message.toString());
			try {
				let data = JSON.parse(message.toString());

				if (topic === getTopicTelemetry(deviceId)) {
					if (data.roomTemp !== undefined) {
						thermostatStore.updateRoomTemp(data.roomTemp);
					}
				} else if (topic === getTopicAttributes(deviceId)) {
					if (data.fanStatus !== undefined) {
						data.fanMode = data.fanStatus;
					}
					thermostatStore.updateState(data);
				} else if (topic.startsWith(deviceId + '/v1/devices/me/rpc/response/')) {
					if (data.roomTemp !== undefined) {
						thermostatStore.updateRoomTemp(data.roomTemp);
					}
					if (data.fanStatus !== undefined) {
						data.fanMode = data.fanStatus;
					}
					thermostatStore.updateState(data);
				}
			} catch (e) {
				console.error('Failed to parse MQTT message', e);
			}
		});

		client.on('error', (err) => {
			console.error('MQTT Connection Error:', err);
			isConnected = false;
		});

		client.on('close', () => {
			isConnected = false;
		});
	}

	function disconnect() {
		if (spValueTimeout) clearTimeout(spValueTimeout);
		client?.end();
	}

	function publishUpdate(update: Partial<ThermostatState>) {
		if (client && isConnected && deviceId) {
			if (update.spValue !== undefined) {
				if (spValueTimeout) clearTimeout(spValueTimeout);
				spValueTimeout = setTimeout(() => {
					client?.publish(
						getTopicRequest(deviceId),
						JSON.stringify({ method: 'remoteSetSpValue', params: update.spValue })
					);
				}, 1500);
			} else {
				client.publish(getTopicRequest(deviceId), JSON.stringify(update));
			}
			// Optimistically update UI
			thermostatStore.updateState(update);
		}
	}

	function togglePower() {
		const newMode = thermostatStore.state.controlMode === 'On' ? 'Off' : 'On';
		if (client && isConnected && deviceId) {
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetControlMode', params: newMode })
			);
			// Optimistically update UI
			thermostatStore.updateState({ controlMode: newMode });
		}
	}

	function setChangeOverMode(changeOverMode: string) {
		if (client && isConnected && deviceId) {
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetChangeOverMode', params: changeOverMode })
			);
			thermostatStore.updateState({ changeOverMode: changeOverMode as any });
		}
	}

	function setFanMode(fanMode: string) {
		// if (fanMode === 'Off') {
		// 	if (client && isConnected && deviceId) {
		// 		client.publish(
		// 			getTopicRequest(deviceId),
		// 			JSON.stringify({ method: 'remoteSetControlMode', params: 'Off' })
		// 		);
		// 		thermostatStore.updateState({ controlMode: 'Off' });
		// 	}
		// 	return;
		// }

		if (client && isConnected && deviceId) {
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetFanMode', params: fanMode })
			);
			thermostatStore.updateState({ fanMode: fanMode as any });
		}
	}

	function setSpValue(value: number) {
		publishUpdate({ spValue: value });
	}

	return {
		get isConnected() {
			return isConnected;
		},
		connect,
		disconnect,
		publishUpdate,
		togglePower,
		setChangeOverMode,
		setFanMode,
		setSpValue
	};
}
