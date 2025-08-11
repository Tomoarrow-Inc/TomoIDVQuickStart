import { useState, useEffect } from 'react';
import { initializeEnvironment, config } from '../ClientEnv';

export const useEnvironment = () => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initEnv = () => {
            try {
                if (initializeEnvironment()) {
                    setIsReady(true);
                    setError(null);
                } else {
                    setIsReady(false);
                    setError('Environment initialization failed');
                }
            } catch (err) {
                setIsReady(false);
                setError(err instanceof Error ? err.message : 'Unknown environment error');
            }
        };

        initEnv();
    }, []);

    return {
        config,
        isReady,
        error,
        retry: () => {
            setError(null);
            setIsReady(false);
            const initEnv = () => {
                if (initializeEnvironment()) {
                    setIsReady(true);
                    setError(null);
                } else {
                    setIsReady(false);
                    setError('Environment initialization failed');
                }
            };
            initEnv();
        }
    };
};
