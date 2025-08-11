import React from 'react';
import { useWebhookConnection } from './hooks/useWebhookConnection';
import { EnvironmentErrorBoundary } from './ClientEnv';
import { UseWebhookConnectionProps } from './types/webhook';

interface SigninProps extends UseWebhookConnectionProps {
    className?: string;
    label?: string;
}

const Signin = ({ className = '', label = 'Tomo Signin', setConnectionStatus, setSessionId }: SigninProps) => {
    const { tlsError, tlsInfo, establishConnection } = useWebhookConnection({
        setConnectionStatus,
        setSessionId
    });

    return (
        <EnvironmentErrorBoundary>
            <button 
                onClick={establishConnection}
                className={className}
            >
                {label}
            </button>
        </EnvironmentErrorBoundary>
    );
};

export default Signin;