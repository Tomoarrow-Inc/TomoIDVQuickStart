import { useEffect, useState } from "react";

interface Config {
    webhookUrl: string;
    tomoIdvUrl: string;
    tomoIdvAppUrl: string;
    storeKycEndpoint: string;
    storeJpKycEndpoint: string;
    generateLinkTokenEndpoint: string;
    environment: 'development' | 'test' | 'production';
}

// 환경 감지 함수
export const getEnvironment = (): 'development' | 'test' | 'production' => {
    const env = process.env.REACT_APP_TOMO_IDV_ENV?.toLowerCase();
    
    if (env === 'development' || env === 'dev') return 'development';
    if (env === 'test') return 'test';
    
    // REACT_APP_TOMO_IDV_ENV가 없거나 다른 값이면 production으로 처리
    return 'production';
};

// 기존 isDevelopment 함수와 호환성을 위한 함수들
export const isDevelopment = (): boolean => {
    return getEnvironment() === 'development';
};

export const isTest = (): boolean => {
    return getEnvironment() === 'test';
};

export const isProduction = (): boolean => {
    return getEnvironment() === 'production';
};

// 환경별 설정 관리
const getEnvironmentConfig = (): Config => {
    const environment = getEnvironment();
    
    switch (environment) {
        case 'development':
            return {
                webhookUrl: 'http://localhost:80/v1/webhook/session',
                tomoIdvUrl: 'http://localhost:8080/auth/tomo-idv',
                tomoIdvAppUrl: 'http://localhost:8080/idv',
                storeKycEndpoint: 'http://localhost:80/v1/us/store',
                storeJpKycEndpoint: 'http://localhost:80/v1/jp/store',
                generateLinkTokenEndpoint: 'http://localhost:80/v1/us/generate_link_token',
                environment: 'development'
            };
            
        case 'test':
            return {
                webhookUrl: 'https://test.tomopayment.com/v1/webhook/session',
                tomoIdvUrl: 'https://app-test.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app-test.tomopayment.com/idv',
                storeKycEndpoint: 'https://test.tomopayment.com/v1/us/store',
                storeJpKycEndpoint: 'https://test.tomopayment.com/v1/jp/store',
                generateLinkTokenEndpoint: 'https://test.tomopayment.com/v1/us/generate_link_token',
                environment: 'test'
            };
            
        case 'production':
            return {
                webhookUrl: 'https://api.tomopayment.com/v1/webhook/session',
                tomoIdvUrl: 'https://app.tomopayment.com/auth/tomo-idv',
                tomoIdvAppUrl: 'https://app.tomopayment.com/idv',
                storeKycEndpoint: 'https://api.tomopayment.com/v1/us/store',
                storeJpKycEndpoint: 'https://api.tomopayment.com/v1/jp/store',
                generateLinkTokenEndpoint: 'https://api.tomopayment.com/v1/us/generate_link_token',             
                environment: 'production'
            };
    }
};

const validateEnvironmentVariables = (): Config => {
    return getEnvironmentConfig();
};

export const config = validateEnvironmentVariables();

// React 앱에서 환경변수 에러를 표시할 컴포넌트
export const EnvironmentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        try {
            validateEnvironmentVariables();
        } catch (e) {
            setError(e instanceof Error ? e : new Error('Configuration error'));
        }
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Configuration Error
                    </h1>
                    <div className="bg-red-100 border-l-4 border-red-500 p-4">
                        <p className="text-red-700 whitespace-pre-wrap font-mono text-sm">
                            {error.message}
                        </p>
                    </div>
                    <p className="mt-4 text-gray-600">
                        Please check your environment configuration and restart the application.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};