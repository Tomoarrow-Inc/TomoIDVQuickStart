import { useState, useCallback, useRef, useEffect } from 'react';
import { config } from '../ClientEnv';
import { UseWebhookConnectionProps } from '../types/webhook';
import { 
    WebhookConnectionService, 
    WebhookConnectionConfig, 
    WebhookConnectionCallbacks 
} from '../services/webhookService';
import { useEnvironment } from './useEnvironment';

export const useWebhookConnection = ({ onConnectionStatusChange, onSessionIdChange }: UseWebhookConnectionProps) => {
    const [tlsError, setTlsError] = useState<string | null>(null);
    const [tlsInfo, setTlsInfo] = useState<string | null>(null);
    const [, setConnectionAttempt] = useState(0);
    const { isReady: isEnvironmentReady, error: envError } = useEnvironment();
    
    const serviceRef = useRef<WebhookConnectionService | null>(null);

    // Initialize service on mount
    useEffect(() => {
        if (!isEnvironmentReady) {
            console.error('Environment is not ready in useWebhookConnection:', envError);
            return;
        }

        const serviceConfig: WebhookConnectionConfig = {
            webhookUrl: config.webhookUrl,
            tomoIdvUrl: config.tomoIdvUrl,
            maxRetries: 3
        };

        const callbacks: WebhookConnectionCallbacks = {
            onStatusChange: onConnectionStatusChange || (() => {}),
            onSessionIdChange: onSessionIdChange,
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
    }, [onConnectionStatusChange, onSessionIdChange, isEnvironmentReady, envError]);

    const establishConnection = useCallback(async () => {
        if (!isEnvironmentReady) {
            console.error('Cannot establish connection: Environment is not ready:', envError);
            return;
        }
        
        if (serviceRef.current) {
            await serviceRef.current.establishConnection();
        }
    }, [isEnvironmentReady, envError]);

    return {
        tlsError,
        tlsInfo,
        establishConnection
    };
};
