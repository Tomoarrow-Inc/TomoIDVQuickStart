// API 설정을 위한 별도 모듈
// verifySessionEndpoint와 resultsEndpoint만을 위한 환경별 분기 처리

// 환경 감지 함수 (ClientEnv와 동일한 로직)
const getApiEnvironment = (): 'development' | 'test' | 'production' => {
    const env = process.env.REACT_APP_TOMO_IDV_ENV?.toLowerCase();
    
    if (env === 'development' || env === 'dev') return 'development';
    if (env === 'test') return 'test';
    
    // REACT_APP_TOMO_IDV_ENV가 없거나 다른 값이면 production으로 처리
    return 'production';
};

// 환경별 API URL 관리
export const getApiEndpoints = () => {
    const environment = getApiEnvironment();
    
    switch (environment) {
        case 'development':
            return {
                verifySessionEndpoint: 'http://localhost:80/v1/verify/session',
                resultsEndpoint: 'http://localhost:80/v1/results'
            };
        case 'test':
            return {
                verifySessionEndpoint: 'https://test.tomopayment.com/v1/verify/session',
                resultsEndpoint: 'https://test.tomopayment.com/v1/results'
            };
        case 'production':
            return {
                verifySessionEndpoint: 'https://api.tomopayment.com/v1/verify/session',
                resultsEndpoint: 'https://api.tomopayment.com/v1/results'
            };
    }
};

// 개별 엔드포인트 접근 함수들
export const getVerifySessionEndpoint = (): string => {
    return getApiEndpoints().verifySessionEndpoint;
};

export const getResultsEndpoint = (): string => {
    return getApiEndpoints().resultsEndpoint;
};

// 현재 환경 정보 반환
export const getCurrentApiEnvironment = (): string => {
    return getApiEnvironment();
};
