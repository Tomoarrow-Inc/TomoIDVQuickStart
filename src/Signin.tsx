import { TomoIDV, UseWebhookConnectionProps } from './modules/tomo-idv-client';

interface SigninProps extends UseWebhookConnectionProps {
    className?: string;
    label?: string;
}

const Signin = ({ className = '', label = 'Tomo Signin', onConnectionStatusChange, onSessionIdChange }: SigninProps) => {
    const { establishConnection } = TomoIDV.useTomoAuth({
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