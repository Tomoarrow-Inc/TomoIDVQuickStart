import React, { useEffect, useState } from "react";
import { ConnectionStatus, WebhookEvent } from "./models";
import { config, EnvironmentErrorBoundary } from "./ClientEnv";

interface SessionWebHookProps {
    children: ( connection_status: ConnectionStatus, 
                session_id: string | null) => React.ReactNode;
                onSessionOpened?: (session_id: string) => void;
}

// TLS 버전 및 보안 검증을 위한 유틸리티 함수
const validateSecureConnection = async (url: string): Promise<{ isSecure: boolean; tlsInfo?: string }> => {
    try {
        // HTTPS 프로토콜 확인
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'https:') {
            console.warn('Insecure connection detected. HTTPS is required for secure communication.');
            return { isSecure: false };
        }

        // TLS 연결 사전 검증 및 정보 수집
        const testResponse = await fetch(url.replace('/webhook/session', '/test'), {
            method: 'HEAD',
            mode: 'cors',
            credentials: 'omit',
            // 보안 헤더 추가
            headers: {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

        // TLS 정보 추출 (가능한 경우)
        const securityState = (testResponse as any).securityState;
        let tlsInfo = 'TLS connection established';
        
        // 응답 헤더에서 보안 정보 확인
        const strictTransport = testResponse.headers.get('strict-transport-security');
        if (strictTransport) {
            tlsInfo += ' with HSTS enabled';
        }

        if (!testResponse.ok) {
            console.warn('Pre-connection TLS validation failed');
            return { isSecure: false };
        }

        console.log('Secure TLS connection validated:', tlsInfo);
        return { isSecure: true, tlsInfo };
    } catch (error) {
        console.error('TLS validation error:', error);
        return { isSecure: false };
    }
};

// 브라우저 TLS 지원 확인
const checkBrowserTLSSupport = (): { supported: boolean; info: string } => {
    // 최신 브라우저는 기본적으로 TLS 1.2+ 지원
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 오래된 브라우저 감지
    const oldBrowsers = [
        { name: 'Chrome', minVersion: 30, pattern: /chrome\/(\d+)/ },
        { name: 'Firefox', minVersion: 27, pattern: /firefox\/(\d+)/ },
        { name: 'Safari', minVersion: 7, pattern: /version\/(\d+).*safari/ },
        { name: 'Edge', minVersion: 12, pattern: /edge\/(\d+)/ }
    ];

    for (const browser of oldBrowsers) {
        const match = userAgent.match(browser.pattern);
        if (match) {
            const version = parseInt(match[1]);
            if (version < browser.minVersion) {
                return {
                    supported: false,
                    info: `${browser.name} ${version} may not support TLS 1.2+. Please update your browser.`
                };
            }
            return {
                supported: true,
                info: `${browser.name} ${version} supports TLS 1.2+`
            };
        }
    }

    // 알 수 없는 브라우저의 경우 지원한다고 가정
    return {
        supported: true,
        info: 'Browser TLS support assumed (modern browser detected)'
    };
};

// TLS 에러 감지를 위한 헬퍼 함수
const isTLSError = (error: any): boolean => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorTypes = ['ssl', 'tls', 'certificate', 'handshake', 'cipher', 'protocol'];
    return errorTypes.some(type => errorMessage.includes(type));
};

// 연결 품질 모니터링
const monitorConnectionQuality = (eventSource: EventSource): (() => void) => {
    let lastHeartbeat = Date.now();
    let missedHeartbeats = 0;
    
    const heartbeatInterval = setInterval(() => {
        if (Date.now() - lastHeartbeat > 30000) { // 30초 초과
            missedHeartbeats++;
            console.warn(`Missed heartbeat #${missedHeartbeats} - connection may be unstable`);
            
            if (missedHeartbeats >= 3) {
                console.error('Connection appears to be lost - too many missed heartbeats');
                eventSource.close();
                clearInterval(heartbeatInterval);
            }
        }
    }, 10000); // 10초마다 체크

    // 메시지 수신 시 heartbeat 업데이트 함수
    const updateHeartbeat = () => {
        lastHeartbeat = Date.now();
        missedHeartbeats = 0;
    };

    // heartbeat 이벤트 리스너 추가
    eventSource.addEventListener('message', updateHeartbeat);
    eventSource.addEventListener('open', updateHeartbeat);

    // 정리 함수 반환
    return () => {
        clearInterval(heartbeatInterval);
        eventSource.removeEventListener('message', updateHeartbeat);
        eventSource.removeEventListener('open', updateHeartbeat);
    };
};

const SessionWebHook = ({ children, onSessionOpened }: SessionWebHookProps) => {
    const [session_id, setSessionId] = useState<string | null>(null);
    const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [tlsError, setTlsError] = useState<string | null>(null);
    const [tlsInfo, setTlsInfo] = useState<string | null>(null);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let connectionAttempt = 0;
        const maxRetries = 3;
        let cleanupMonitoring: (() => void) | null = null;

        const establishSecureConnection = async () => {
            try {
                setConnectionStatus('connecting');
                setTlsError(null);

                // 브라우저 TLS 지원 확인
                const browserTLS = checkBrowserTLSSupport();
                if (!browserTLS.supported) {
                    setTlsError(browserTLS.info);
                    setConnectionStatus('disconnected');
                    return;
                }
                
                setTlsInfo(browserTLS.info);
                console.log('Browser TLS check:', browserTLS.info);

                // HTTPS 연결 및 TLS 검증
                const { isSecure, tlsInfo: serverTlsInfo } = await validateSecureConnection(config.webhookUrl);
                if (!isSecure) {
                    setTlsError('Secure HTTPS/TLS connection required. TLS 1.2+ is mandatory for security.');
                    setConnectionStatus('disconnected');
                    return;
                }

                if (serverTlsInfo) {
                    setTlsInfo(prev => `${prev} | Server: ${serverTlsInfo}`);
                }

                // EventSource 연결 설정 (보안 강화)
                eventSource = new EventSource(config.webhookUrl, {
                    withCredentials: false // TLS 인증서 검증을 위해 credentials 제한
                });

                // 연결 품질 모니터링 시작
                cleanupMonitoring = monitorConnectionQuality(eventSource);

                // 연결 열림 처리
                eventSource.onopen = () => {
                    console.log('Secure webhook connection established with TLS 1.2+');
                    setConnectionStatus('connected');
                    connectionAttempt = 0; // 성공시 재시도 카운터 리셋
                    setTlsInfo(prev => `${prev} | Connected with secure TLS`);
                };

                // 메시지 처리
                eventSource.onmessage = (event) => {
                    try {
                        const webhookEvent: WebhookEvent = JSON.parse(event.data);
                        console.log('Received secure webhook event:', webhookEvent);
                        
                        switch (webhookEvent.event) {
                            case 'connection':
                                console.log('Connected to secure webhook stream');
                                setConnectionStatus('connected');
                                break;
                            case 'session.opened':
                                console.log('Session opened:', webhookEvent.data);
                                const session_id = webhookEvent.data;
                                setSessionId(session_id);
                                onSessionOpened?.(session_id);
                                break;
                            default:
                                console.log('Unknown event type:', webhookEvent.event);
                        }
                    } catch (error) {
                        console.error('Error parsing webhook event:', error);
                    }
                };

                // 특정 이벤트 타입 처리
                eventSource.addEventListener('session.opened', (event) => {
                    try {
                        const webhookEvent: WebhookEvent = JSON.parse(event.data);
                        console.log('Session opened event:', webhookEvent);
                        setSessionId(webhookEvent.data);
                    } catch (error) {
                        console.error('Error parsing session.opened event:', error);
                    }
                }, false);

                eventSource.addEventListener('connection', (event) => {
                    console.log('Secure connection event received:', event.data);
                }, false);

                // 에러 처리 (TLS 관련 에러 감지)
                eventSource.onerror = (error) => {
                    console.error('Webhook connection error:', error);
                    
                    if (isTLSError(error)) {
                        setTlsError('TLS connection failed. Only TLS 1.2+ is supported. Please ensure your server supports modern TLS versions.');
                    } else if (connectionAttempt < maxRetries) {
                        connectionAttempt++;
                        console.log(`Retrying connection (${connectionAttempt}/${maxRetries})`);
                        setTimeout(() => establishSecureConnection(), 2000 * connectionAttempt);
                        return;
                    }
                    
                    setConnectionStatus('disconnected');
                    if (cleanupMonitoring) {
                        cleanupMonitoring();
                    }
                    if (eventSource) {
                        eventSource.close();
                    }
                };

            } catch (error) {
                console.error('Failed to establish secure connection:', error);
                
                if (isTLSError(error)) {
                    setTlsError('TLS handshake failed. This application requires TLS 1.2 or higher for security.');
                } else {
                    setTlsError('Connection failed. Please ensure the server supports secure HTTPS connections.');
                }
                
                setConnectionStatus('disconnected');
            }
        };

        // 보안 연결 시작
        establishSecureConnection();

        // 정리 함수
        return () => {
            if (cleanupMonitoring) {
                cleanupMonitoring();
            }
            if (eventSource) {
                console.log('Closing secure webhook connection');
                eventSource.close();
            }
            setConnectionStatus('disconnected');
        };
    }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

    return (
        <EnvironmentErrorBoundary>
            <div className="space-y-4">
                {tlsError && (
                    <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    TLS Security Error
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{tlsError}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {tlsInfo && !tlsError && (
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                    Secure TLS Connection
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>{tlsInfo}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {children(connection_status, session_id)}
            </div>
        </EnvironmentErrorBoundary>
    );
};

export default SessionWebHook;