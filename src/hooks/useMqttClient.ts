import { useEffect, useState, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { ThermostatState } from '@/types';

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

export function useMqttClient(
	onStateUpdate: (update: Partial<ThermostatState>) => void,
	onRoomTempUpdate: (temp: number) => void
) {
	const [isConnected, setIsConnected] = useState(false);
	const clientRef = useRef<mqtt.MqttClient | null>(null);
	const deviceIdRef = useRef('');
	const spValueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const connect = useCallback((deviceId: string) => {
		const clientId = `uni_${Math.random().toString(16).slice(2)}`;
		deviceIdRef.current = deviceId;

		const client = mqtt.connect(MQTT_BROKER, { clientId });
		clientRef.current = client;

		client.on('connect', () => {
			console.log('Connected to MQTT broker');
			client.subscribe([
				getTopicResponse(deviceId),
				getTopicAttributes(deviceId),
				getTopicTelemetry(deviceId),
				getTopicRequest(deviceId)
			]);

			// Request initial state
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetMenuSet' })
			);
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetAttributes' })
			);
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetTelemetry' })
			);
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteGetDeviceStatus' })
			);
		});

		client.on('message', (topic, message) => {
			setIsConnected(true);
			console.log('MQTT Message:', topic, message.toString());
			try {
				const data = JSON.parse(message.toString());

				if (topic === getTopicTelemetry(deviceId)) {
					if (data.roomTemp !== undefined) {
						onRoomTempUpdate(data.roomTemp);
					}
				} else if (topic === getTopicAttributes(deviceId)) {
					if (data.fanStatus !== undefined) {
						data.fanMode = data.fanStatus;
					}
					onStateUpdate(data);
				} else if (topic.startsWith(deviceId + '/v1/devices/me/rpc/response/')) {
					if (data.roomTemp !== undefined) {
						onRoomTempUpdate(data.roomTemp);
					}
					if (data.fanStatus !== undefined) {
						data.fanMode = data.fanStatus;
					}
					onStateUpdate(data);
				}
			} catch (e) {
				console.error('Failed to parse MQTT message', e);
			}
		});

		client.on('error', (err) => {
			console.error('MQTT Connection Error:', err);
			setIsConnected(false);
		});

		client.on('close', () => {
			setIsConnected(false);
		});
	}, [onStateUpdate, onRoomTempUpdate]);

	const disconnect = useCallback(() => {
		if (spValueTimeoutRef.current) clearTimeout(spValueTimeoutRef.current);
		if (clientRef.current) {
			clientRef.current.end();
		}
	}, []);

	const publishUpdate = useCallback((update: Partial<ThermostatState>) => {
		const client = clientRef.current;
		const deviceId = deviceIdRef.current;

		if (client && isConnected && deviceId) {
			if (update.spValue !== undefined) {
				if (spValueTimeoutRef.current) clearTimeout(spValueTimeoutRef.current);
				spValueTimeoutRef.current = setTimeout(() => {
					client.publish(
						getTopicRequest(deviceId),
						JSON.stringify({ method: 'remoteSetSpValue', params: update.spValue })
					);
				}, 1500);
			} else {
				client.publish(getTopicRequest(deviceId), JSON.stringify(update));
			}
			onStateUpdate(update);
		}
	}, [isConnected, onStateUpdate]);

	const togglePower = useCallback(() => {
		const client = clientRef.current;
		const deviceId = deviceIdRef.current;

		if (client && isConnected && deviceId) {
			// Get current state - we'll read from parent component's state
			// For now, just toggle
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetControlMode', params: 'toggle' })
			);
		}
	}, [isConnected]);

	const setChangeOverMode = useCallback((mode: string) => {
		const client = clientRef.current;
		const deviceId = deviceIdRef.current;

		if (client && isConnected && deviceId) {
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetChangeOverMode', params: mode })
			);
			onStateUpdate({ changeOverMode: mode as any });
		}
	}, [isConnected, onStateUpdate]);

	const setFanMode = useCallback((mode: string) => {
		const client = clientRef.current;
		const deviceId = deviceIdRef.current;

		if (client && isConnected && deviceId) {
			client.publish(
				getTopicRequest(deviceId),
				JSON.stringify({ method: 'remoteSetFanMode', params: mode })
			);
			onStateUpdate({ fanMode: mode as any });
		}
	}, [isConnected, onStateUpdate]);

	const setSpValue = useCallback((value: number) => {
		publishUpdate({ spValue: value });
	}, [publishUpdate]);

	return {
		isConnected,
		connect,
		disconnect,
		publishUpdate,
		togglePower,
		setChangeOverMode,
		setFanMode,
		setSpValue
	};
}
