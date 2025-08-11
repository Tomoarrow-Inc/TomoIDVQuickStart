import React from 'react';
import { TomoIDV } from './modules/TomoIDV';
import { UseWebhookConnectionProps } from './modules/types/webhook';
import { EnvironmentErrorBoundary } from './test/modules/ClientEnv';

interface SigninProps extends UseWebhookConnectionProps {
    className?: string;
    label?: string;
}

const Signin = ({ className = '', label = 'Tomo Signin', onConnectionStatusChange, onSessionIdChange }: SigninProps) => {
    const { establishConnection } = TomoIDV.useWebhookConnection({
        onConnectionStatusChange,
        onSessionIdChange
    });

    return (
        <button 
            onClick={establishConnection}
            className={className}
        >
            {label}
        </button>
    );
};

export default Signin;