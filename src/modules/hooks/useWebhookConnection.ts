import { useState, useCallback, useRef, useEffect } from 'react';
import { config } from '../ClientEnv';
import { UseWebhookConnectionProps } from '../types/webhook';
import { 
    WebhookConnectionService, 
    WebhookConnectionConfig, 
    WebhookConnectionCallbacks 
} from '../services/webhookService';

export const useWebhookConnection = ({ setConnectionStatus, setSessionId }: UseWebhookConnectionProps) => {
    const [tlsError, setTlsError] = useState<string | null>(null);
    const [tlsInfo, setTlsInfo] = useState<string | null>(null);
    const [connectionAttempt, setConnectionAttempt] = useState(0);
    
    const serviceRef = useRef<WebhookConnectionService | null>(null);

    // Initialize service on mount
    useEffect(() => {
        const serviceConfig: WebhookConnectionConfig = {
            webhookUrl: config.webhookUrl,
            tomoIdvUrl: config.tomoIdvUrl,
            maxRetries: 3
        };

        const callbacks: WebhookConnectionCallbacks = {
            onStatusChange: setConnectionStatus,
            onSessionIdChange: setSessionId,
            onTlsErrorChange: setTlsError,
            onTlsInfoChange: setTlsInfo,
            onConnectionAttemptChange: setConnectionAttempt
        };

        serviceRef.current = new WebhookConnectionService(serviceConfig, callbacks);

        // Cleanup on unmount
        return () => {
            if (serviceRef.current) {
                serviceRef.current.cleanup();
            }
        };
    }, [setConnectionStatus, setSessionId]);

    const establishConnection = useCallback(async () => {
        if (serviceRef.current) {
            await serviceRef.current.establishConnection();
        }
    }, []);

    return {
        tlsError,
        tlsInfo,
        establishConnection
    };
};
