import { config, isDevelopment } from '../ClientEnv';
import { 
    validateSecureConnection, 
    checkBrowserTLSSupport, 
    isTLSError, 
    monitorConnectionQuality 
} from '../utils/connectionUtils';
import { openTomoIDVPopup } from '../utils/popupUtils';
import { WebhookEvent } from '../types/webhook';

export interface WebhookConnectionConfig {
    webhookUrl: string;
    tomoIdvUrl: string;
    maxRetries?: number;
}

export interface WebhookConnectionCallbacks {
    onStatusChange: (status: string) => void;
    onSessionIdChange: (sessionId: string) => void;
    onTlsErrorChange: (error: string | null) => void;
    onTlsInfoChange: (info: string | null) => void;
    onConnectionAttemptChange: (attempt: number) => void;
}

export interface WebhookConnectionState {
    tlsError: string | null;
    tlsInfo: string | null;
    connectionAttempt: number;
    maxRetries: number;
}

export class WebhookConnectionService {
    private config: WebhookConnectionConfig;
    private callbacks: WebhookConnectionCallbacks;
    private state: WebhookConnectionState;
    private eventSource: EventSource | null = null;
    private cleanupMonitoring: (() => void) | null = null;

    constructor(config: WebhookConnectionConfig, callbacks: WebhookConnectionCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
        this.state = {
            tlsError: null,
            tlsInfo: null,
            connectionAttempt: 0,
            maxRetries: config.maxRetries || 3
        };
    }

    public async establishConnection(): Promise<void> {
        try {
            this.callbacks.onStatusChange('connecting');
            this.callbacks.onTlsErrorChange(null);

            const isDevMode = isDevelopment();
            console.log(`Environment: ${isDevMode ? 'Development' : 'Production'}`);

            const browserTLS = checkBrowserTLSSupport();
            if (!browserTLS.supported && !isDevMode) {
                this.state.tlsError = browserTLS.info;
            this.callbacks.onTlsErrorChange(browserTLS.info);
                this.callbacks.onStatusChange('disconnected');
                return;
            }

            this.state.tlsInfo = browserTLS.info;
            this.callbacks.onTlsInfoChange(browserTLS.info);
            console.log('Browser check:', browserTLS.info);

            const { isSecure, tlsInfo: serverTlsInfo } = await validateSecureConnection(this.config.webhookUrl);
            if (!isSecure) {
                const errorMsg = isDevMode
                    ? 'Connection validation failed in development mode'
                    : 'Secure HTTPS/TLS connection required. TLS 1.2+ is mandatory for security in production.';
                this.state.tlsError = errorMsg;
                this.callbacks.onTlsErrorChange(errorMsg);
                this.callbacks.onStatusChange('disconnected');
                return;
            }

            if (serverTlsInfo) {
                const currentInfo = this.state.tlsInfo || '';
                const newInfo = `${currentInfo} | Server: ${serverTlsInfo}`;
                this.state.tlsInfo = newInfo;
                this.callbacks.onTlsInfoChange(newInfo);
            }

            this.eventSource = new EventSource(this.config.webhookUrl, {
                withCredentials: false
            });

            this.cleanupMonitoring = monitorConnectionQuality(this.eventSource);

            this.setupEventListeners(isDevMode);

        } catch (error) {
            console.error('Failed to establish connection:', error);

            if (isTLSError(error) && !isDevelopment()) {
                const tlsError = 'TLS handshake failed. This application requires TLS 1.2 or higher for security.';
                this.state.tlsError = tlsError;
                this.callbacks.onTlsErrorChange(tlsError);
            } else {
                const errorMsg = isDevelopment()
                    ? 'Connection failed in development mode. Please check the server configuration.'
                    : 'Connection failed. Please ensure the server supports secure HTTPS connections.';
                this.state.tlsError = errorMsg;
                this.callbacks.onTlsErrorChange(errorMsg);
            }

            this.callbacks.onStatusChange('disconnected');
        }
    }

    private setupEventListeners(isDevMode: boolean): void {
        if (!this.eventSource) return;

        this.eventSource.onopen = () => {
            const connectionMsg = isDevMode
                ? 'Webhook connection established (development mode)'
                : 'Secure webhook connection established with TLS 1.2+';
            console.log(connectionMsg);
            this.callbacks.onStatusChange('connected');
            this.state.connectionAttempt = 0;
            this.callbacks.onConnectionAttemptChange(0);

            const tlsMsg = isDevMode
                ? 'Connected in development mode'
                : 'Connected with secure TLS';
            const currentInfo = this.state.tlsInfo || '';
            const newInfo = `${currentInfo} | ${tlsMsg}`;
            this.state.tlsInfo = newInfo;
            this.callbacks.onTlsInfoChange(newInfo);
        };

        this.eventSource.onmessage = (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Received webhook event:', webhookEvent);

                switch (webhookEvent.event) {
                    case 'connection':
                        const connectMsg = isDevMode
                            ? 'Connected to webhook stream (development)'
                            : 'Connected to secure webhook stream';
                        console.log(connectMsg);
                        this.callbacks.onStatusChange('connected');
                        break;
                    case 'session.opened':
                        console.log('Session opened:', webhookEvent.data);
                        const session_id = webhookEvent.data;
                        this.callbacks.onSessionIdChange(session_id);
                        break;
                    default:
                        console.log('Unknown event type:', webhookEvent.event);
                }
            } catch (error) {
                console.error('Error parsing webhook event:', error);
            }
        };

        this.eventSource.addEventListener('session.opened', (event) => {
            try {
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Session opened event:', webhookEvent);
                this.callbacks.onSessionIdChange(webhookEvent.data);
            } catch (error) {
                console.error('Error parsing session.opened event:', error);
            }
        }, false);

        this.eventSource.addEventListener('connection', (event) => {
            try{ 
                const webhookEvent: WebhookEvent = JSON.parse(event.data);
                console.log('Connection event:', webhookEvent);
                const eventMsg = isDevMode
                    ? 'Connection event received (development)'
                    : 'Secure connection event received';
                console.log(eventMsg, event.data);

                openTomoIDVPopup(webhookEvent.data);

            } catch (error) {
                console.error('Error parsing connection event:', error);
            }
        }, false);

        this.eventSource.onerror = (error) => {
            console.error('Webhook connection error:', error);

            if (isTLSError(error) && !isDevMode) {
                const tlsError = 'TLS connection failed. Only TLS 1.2+ is supported. Please ensure your server supports modern TLS versions.';
                this.state.tlsError = tlsError;
                this.callbacks.onTlsErrorChange(tlsError);
            } else if (this.state.connectionAttempt < this.state.maxRetries) {
                const newAttempt = this.state.connectionAttempt + 1;
                this.state.connectionAttempt = newAttempt;
                this.callbacks.onConnectionAttemptChange(newAttempt);
                console.log(`Retrying connection (${newAttempt}/${this.state.maxRetries})`);
                setTimeout(() => this.establishConnection(), 2000 * newAttempt);
                return;
            }

            this.callbacks.onStatusChange('disconnected');
            this.cleanup();
        };
    }

    public cleanup(): void {
        if (this.cleanupMonitoring) {
            this.cleanupMonitoring();
            this.cleanupMonitoring = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    public getState(): WebhookConnectionState {
        return { ...this.state };
    }
}

// Factory function for creating webhook connection service
export const createWebhookConnectionService = (
    config: WebhookConnectionConfig,
    callbacks: WebhookConnectionCallbacks
): WebhookConnectionService => {
    return new WebhookConnectionService(config, callbacks);
};
