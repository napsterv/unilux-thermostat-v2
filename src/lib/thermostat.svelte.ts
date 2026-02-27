import { onMount, onDestroy } from 'svelte';
import mqtt from 'mqtt';

export class Thermostat {
    client = $state<mqtt.MqttClient | null>(null);
    isConnected = $state(false);
    deviceId = $state('');
    roomTemp = $state(0);
    clientId = `uni_${Math.random().toString(16).slice(2)}`;
    isDarkMode = $state(true);
    
    thermostatState = $state({
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

    MQTT_BROKER = 'ws://mqapi.uniluxthermostat.com:8083';
    MIN_TEMP = 5;
    MAX_TEMP = 40;
    STEP = 0.5;

    spValueTimeout: ReturnType<typeof setTimeout> | null = null;

    ratio = $derived((this.thermostatState.spValue - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP));

    constructor() {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.isDarkMode = savedTheme === 'dark';
                document.documentElement.classList.toggle('light-mode', !this.isDarkMode);
            }
        }
    }

    getTopicResponse(id: string) { return `${id}/v1/devices/me/rpc/response/0`; }
    getTopicAttributes(id: string) { return `${id}/v1/devices/me/attributes`; }
    getTopicTelemetry(id: string) { return `${id}/v1/devices/me/telemetry`; }
    getTopicRequest(id: string) { return `${id}/v1/devices/me/rpc/request/`; }

    toggleDarkMode = () => {
        this.isDarkMode = !this.isDarkMode;
        if (typeof document !== 'undefined') {
            const mode = this.isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', mode);
            document.documentElement.classList.toggle('light-mode', !this.isDarkMode);
        }
    }

    handleSliderChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const newValue = parseFloat(target.value);
        if (newValue !== this.thermostatState.spValue) {
            this.publishUpdate({ spValue: newValue });
        }
    }

    init() {
        if (typeof window === 'undefined') return;

        let storedDeviceId = localStorage.getItem('deviceId');
        if (!storedDeviceId) {
            storedDeviceId = prompt('Please enter your Device ID:');
            if (storedDeviceId) {
                localStorage.setItem('deviceId', storedDeviceId);
            }
        }
        
        if (storedDeviceId) {
            console.log(`Using Device ID: ${storedDeviceId}`);
            this.deviceId = storedDeviceId;
            this.client = mqtt.connect(this.MQTT_BROKER, { clientId: this.clientId });

            this.client.on('connect', () => {
                this.client?.subscribe([
                    this.getTopicResponse(this.deviceId),
                    this.getTopicAttributes(this.deviceId),
                    this.getTopicTelemetry(this.deviceId),
                    this.getTopicRequest(this.deviceId)
                ]);

                this.client?.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteGetMenuSet" }));
                this.client?.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteGetAttributes" }));
                this.client?.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteGetTelemetry" }));
                this.client?.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteGetDeviceStatus" }));
            });

            this.client.on('message', (topic, message) => {
                this.isConnected = true;
                console.log('MQTT Message:', topic, message.toString());
                try {
                    let data = JSON.parse(message.toString());
                    
                    if (topic === this.getTopicTelemetry(this.deviceId)) {
                        if (data.roomTemp !== undefined) {
                            this.roomTemp = data.roomTemp;
                        }
                    } else if (topic === this.getTopicAttributes(this.deviceId)) {
                        if (data.fanStatus !== undefined) {
                            this.thermostatState.fanMode = data.fanStatus;
                        }
                        this.thermostatState = { ...this.thermostatState, ...data };
                    } else if (topic.startsWith(this.deviceId + '/v1/devices/me/rpc/response/')) {
                        if (data.roomTemp !== undefined) {
                            this.roomTemp = data.roomTemp;
                        }
                        if (data.fanStatus !== undefined) {
                            this.thermostatState.fanMode = data.fanStatus;
                        }
                        this.thermostatState = { ...this.thermostatState, ...data };
                    }
                } catch (e) {
                    console.error('Failed to parse MQTT message', e);
                }
            });

            this.client.on('error', (err) => {
                console.error('MQTT Connection Error:', err);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });
        }
    }

    destroy() {
        if (this.spValueTimeout) clearTimeout(this.spValueTimeout);
        this.client?.end();
    }

    publishUpdate(update: Partial<typeof this.thermostatState>) {
        if (this.client && this.isConnected && this.deviceId) {
            const newState = { ...this.thermostatState, ...update };
            if (update.spValue !== undefined) {
                if (this.spValueTimeout) clearTimeout(this.spValueTimeout);
                this.spValueTimeout = setTimeout(() => {
                    this.client?.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteSetSpValue", "params": update.spValue }));
                }, 1500);
            } else {
                this.client.publish(this.getTopicRequest(this.deviceId), JSON.stringify(newState));
            }
            this.thermostatState = newState;
        }
    }

    togglePower = () => {
        const newMode = this.thermostatState.controlMode === 'On' ? 'Off' : 'On';
        if (this.client && this.isConnected && this.deviceId) {
            this.client.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteSetControlMode", "params": newMode }));
            this.thermostatState.controlMode = newMode;
        }
    }

    adjustTemperature = (delta: number) => {
        const newTemp = this.thermostatState.spValue + delta;
        this.publishUpdate({ spValue: Math.min(this.MAX_TEMP, Math.max(this.MIN_TEMP, newTemp)) });
    }

    setMode = (mainMode: string) => {
        this.publishUpdate({ mainMode });
    }

    setChangeOverMode = (changeOverMode: string) => {
        if (this.client && this.isConnected && this.deviceId) {
            this.client.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteSetChangeOverMode", "params": changeOverMode }));
            this.thermostatState.changeOverMode = changeOverMode;
        }
    }

    setFan = (fanMode: string) => {
        if (fanMode === 'Off') {
            if (this.client && this.isConnected && this.deviceId) {
                this.client.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteSetControlMode", "params": "Off" }));
                this.thermostatState.controlMode = 'Off';
            }
            return;
        }

        if (this.client && this.isConnected && this.deviceId) {
            this.client.publish(this.getTopicRequest(this.deviceId), JSON.stringify({ "method": "remoteSetFanMode", "params": fanMode }));
            this.thermostatState.fanMode = fanMode;
        }
    }
}
