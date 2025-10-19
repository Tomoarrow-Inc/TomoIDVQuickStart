import { useState } from 'react';
// import { ConnectionStatus, TomoIDV, IssueAccessTokenResult } from 'tomo-idv-client';
import { ConnectionStatus, TomoIDV } from './modules/tomo-idv-client';
import './Home.css';

export default function TomoIDVClient() {
  const [session_id, setSessionId] = useState<string | null>(null);
  const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isIDVCompleted, setIsIDVCompleted] = useState(false);
  const [assertionResult, setAssertionResult] = useState<any>(null);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // React Hook calls at the top level
  const { establishConnection } = TomoIDV.useTomoAuth({
    onConnectionStatusChange: setConnectionStatus,
    onSessionIdChange: setSessionId
  });
  const { openTomoIDVPopup } = TomoIDV.useTomoIDV();
  const { createClientAssertion, isLoading: isAssertionLoading } = TomoIDV.useAssertion({
    onAssertionCreated: (assertion: string) => {
      console.log('Assertion created:', assertion);
      setVerificationResult({ assertion });
    },
    onError: (error: Error) => {
      console.error('Assertion creation failed:', error);
    }
  });

  // 로그 추가 헬퍼 함수
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await establishConnection();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIDV = async () => {
    if (!session_id) return;
    try {
      openTomoIDVPopup(session_id);
      // Reset IDV completion status when starting new verification
      setIsIDVCompleted(false);
    } catch (error) {
      console.error('IDV failed:', error);
    }
  };

  const handleVerifySession = async () => {
    if (!session_id) return;
    try {
      const response = await fetch(`https://test.tomopayment.com/v1/verify/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id })
        });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Verify session result:', data);
      setVerificationResult(data);
    } catch (error) {
      console.error('Session verification failed:', error);
    }
  };

  const handleGetKYC = async (nationality: string) => {
    if (!session_id) return;
    try {
      const response = await fetch(`https://test.tomopayment.com/v1/${nationality}/verify/kyc`,
        {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id, nationality })
        });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`KYC data for ${nationality}:` + JSON.stringify(data, null, 2));
      setVerificationResult(data);
      
      // Check if verification is completed based on result
      if (data && data.verified === 'true') {
        setIsIDVCompleted(true);
      }
    } catch (error) {
      console.error('KYC retrieval failed:', error);
    }
  };


  const handleCreateClientAssertion = async () => {
    try {
      addLog('🔐 Starting client assertion creation...');
      
      // 예시 설정 - 실제 사용 시에는 사용자의 private key와 client ID를 입력받아야 함
      const assertionConfig = {
        privateKey: 'eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IkxTbnNFNTlQd3pTWlBwVERGdFpZR3VxMmZuam0tSmV3MVJjMzdyeGplVGMiLCJ5IjoiS3kyNjV4aVR3bWo3eVloMDV2Q3NIVWhBc2RVcm5iVnROY1dFdEpRVnVVVSIsImQiOiJmbnYxN0lYTWxvMFo3MlNwaWE0eWJlTllTSm9TMFNRYjdFaGUyN19YN2xrIn0', // base64Url 인코딩된 JWK
        clientId: '3855e5678a3c42c1fef97ce3b9948c83' // 실제 클라이언트 ID로 교체 필요
      };
      
      addLog('📝 Assertion configuration:');
      addLog(`  clientId: ${assertionConfig.clientId}`);
      addLog(`  privateKey: ${assertionConfig.privateKey.substring(0, 50)}...`);
      
      // Step 1: Create assertion
      const assertion = await createClientAssertion(assertionConfig);
      addLog('✅ Client assertion created successfully!');
      addLog(`🔑 Assertion JWT: ${assertion.substring(0, 100)}...`);
      
      // app.service.ts와 동일하게 단순하게 assertion만 저장
      setAssertionResult({ assertion });
      setVerificationResult({ assertion });
      
      // Step 2: Immediately request access token with the created assertion
      addLog('🚀 Starting access token request...');
      
      const params = new URLSearchParams();
      params.set('grant_type', 'client_credentials');
      params.set('scope', 'idv.read');
      params.set('resource', 'https://test.tomopayment.com');
      params.set('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      params.set('client_assertion', assertion);
      
      addLog('📝 Request parameters:');
      addLog(`  endpoint: https://test.tomopayment.com/v1/oauth2/token`);
      addLog(`  grant_type: ${params.get('grant_type')}`);
      addLog(`  scope: ${params.get('scope')}`);
      addLog(`  resource: ${params.get('resource')}`);
      addLog(`  client_assertion_type: ${params.get('client_assertion_type')}`);
      addLog(`  client_assertion: ${assertion.substring(0, 50)}...`);
      addLog(`  assertion length: ${assertion.length} chars`);

      const response = await fetch('https://test.tomopayment.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          DPoP: 'dpop-proof', // CORS Preflight을 트리거할 수 있으므로 제거
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ HTTP error! status: ${response.status}`);
        addLog(`❌ Error message: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      addLog('✅ Access token received successfully!');
      addLog(`📊 Response: ${JSON.stringify(data, null, 2)}`);
      
      // app.service.ts와 동일하게 단순하게 토큰 응답만 저장
      setTokenResult(data);
      setVerificationResult(data);
      
      addLog('🎉 Complete! Assertion created and access token obtained successfully!');
      
    } catch (error) {
      addLog(`❌ Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAssertionResult({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <div className="tomo-idv-container">
      {/* Header with Connection Status */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">TomoIDV Demo</h1>
          <div className="header-info">
            <div className="connection-status">
              {connection_status === 'connected' ? (
                <div className="status-connected">
                  <div className="status-dot connected"></div>
                  Connected
                </div>
              ) : (
                <div className="status-disconnected">
                  <div className="status-dot disconnected"></div>
                  Disconnected
                </div>
              )}
            </div>
            {session_id && (
              <div className="session-info">
                <span className="session-label">Session:</span>
                <span className="session-id">{session_id}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          {/* Left Side - Authentication Steps */}
          <div className="left-panel">
            {/* Step 1: Authentication */}
            <div className="action-section">
              <h3 className="section-title">Step 1: Authentication</h3>
              <div className="action-card">
                <div className="action-header">
                  <div className="action-icon">🔐</div>
                  <div>
                    <h4 className="action-title">Connect to TomoIDV</h4>
                    <p className="action-description">Establish secure connection for identity verification</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogin} 
                  disabled={isLoading} 
                  className="primary-action-button"
                >
                  {isLoading ? (
                    <div className="loading-content">
                      <div className="spinner"></div>
                      Connecting...
                    </div>
                  ) : (
                    'Login with TomoIDV'
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Identity Verification */}
            <div className="action-section">
              <h3 className="section-title">Step 2: Identity Verification</h3>
              <div className="action-card">
                <div className="action-header">
                  <div className="action-icon">🆔</div>
                  <div>
                    <h4 className="action-title">Start IDV Process</h4>
                    <p className="action-description">Complete identity verification to proceed with purchase</p>
                  </div>
                </div>
                <button 
                  onClick={handleStartIDV} 
                  disabled={!session_id || isLoading}
                  className="secondary-action-button"
                >
                  {isIDVCompleted ? 'IDV Completed ✅' : 'Start Identity Verification'}
                </button>
                {isIDVCompleted && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontSize: '14px' }}>
                    ✅ Identity verification completed successfully
                  </div>
                )}
              </div>
            </div>

            {/* Response Result Panel - Compact */}
            <div className="results-panel-compact">
              <div className="result-card-compact">
                <h3 className="result-title-compact">
                  <div className="status-icon green"></div>
                  Response Result
                </h3>
                <div className="result-content-compact">
                  {/* Assertion Result */}
                  {assertionResult && (
                    <div className="json-display-compact" style={{ marginBottom: '16px' }}>
                      <div className="json-header-compact">
                        <span className="json-type">🔐 Assertion Result</span>
                        <button 
                          className="copy-button-compact"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(assertionResult, null, 2));
                          }}
                          title="Copy to clipboard"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="json-content-compact">
                        <pre className="result-json-compact">
                          {JSON.stringify(assertionResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Token Result */}
                  {tokenResult && (
                    <div className="json-display-compact" style={{ marginBottom: '16px' }}>
                      <div className="json-header-compact">
                        <span className="json-type">🎫 Token Result</span>
                        <button 
                          className="copy-button-compact"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(tokenResult, null, 2));
                          }}
                          title="Copy to clipboard"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="json-content-compact">
                        <pre className="result-json-compact">
                          {JSON.stringify(tokenResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Other API Results */}
                  {verificationResult && !assertionResult && !tokenResult && (
                    <div className="json-display-compact">
                      <div className="json-header-compact">
                        <span className="json-type">JSON Response</span>
                        <button 
                          className="copy-button-compact"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(verificationResult, null, 2));
                          }}
                          title="Copy to clipboard"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="json-content-compact">
                        <pre className="result-json-compact">
                          {JSON.stringify(verificationResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Logs */}
                  {logs.length > 0 && (
                    <div className="json-display-compact" style={{ marginTop: '16px' }}>
                      <div className="json-header-compact">
                        <span className="json-type">📝 Process Logs</span>
                        <button 
                          className="copy-button-compact"
                          onClick={() => {
                            navigator.clipboard.writeText(logs.join('\n'));
                          }}
                          title="Copy logs to clipboard"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="json-content-compact">
                        <div style={{ 
                          backgroundColor: '#1a1a1a', 
                          color: '#00ff00', 
                          fontFamily: 'monospace', 
                          fontSize: '12px',
                          padding: '12px',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {logs.map((log, index) => (
                            <div key={index} style={{ marginBottom: '4px' }}>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!verificationResult && !assertionResult && !tokenResult && logs.length === 0 && (
                    <div className="no-result-compact">
                      <div className="no-result-icon">{"{ }"}</div>
                      <div className="no-result-text">
                        <h4>No Response Data</h4>
                        <p>Test Built-in APIs to retrieve JSON response from the server</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Developer Tools */}
          <div className="right-panel">
            {/* Developer Tools Section */}
            <div className="utility-section">
              <h3 className="section-title">Built-in APIs</h3>
              
              {/* Base URL */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Base URL</h4>
                </div>
                <div className="endpoint-item">
                  <div className="endpoint-code">
                    <span className="url">https://test.tomopayment.com/v1</span>
                    {/* <button 
                      onClick={() => navigator.clipboard.writeText('https://test.tomopayment.com/v1')}
                      className="copy-icon"
                      title="Copy to clipboard"
                    >
                      📋
                    </button> */}
                  </div>
                </div>
              </div>
                
              {/* Verify Session */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Verify Session</h4>
                </div>
                <p className="api-description">Validates the current session and returns session status information</p>
                <div className="endpoint-item">
                  <div className="endpoint-code">
                    <span className="method">POST</span>
                    <span className="url">/verify/session</span>
                  </div>
                  <button 
                    onClick={handleVerifySession} 
                    disabled={!session_id}
                    className="test-button"
                  >
                    Test
                  </button>
                </div>
              </div>
              
              {/* Get KYC Data */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Get KYC Data</h4>
                  <p className="api-description">Retrieves KYC verification results and user data by nationality</p>
                </div>
                
                {/* Nationality KYC API Endpoints */}
                <div className="kyc-endpoints">
                  {/* Japan KYC */}
                  <div className="endpoint-item">
                    <div className="endpoint-code">
                      <span className="method">POST</span>
                      <span className="url">/jp/verify/kyc</span>
                    </div>
                    <button 
                      onClick={() => handleGetKYC('jp')} 
                      disabled={!session_id}
                      className="test-button"
                    >
                      Test
                    </button>
                  </div>
                  
                  {/* USA KYC */}
                  <div className="endpoint-item">
                    <div className="endpoint-code">
                      <span className="method">POST</span>
                      <span className="url">/us/verify/kyc</span>
                    </div>
                    <button 
                      onClick={() => handleGetKYC('us')} 
                      disabled={!session_id}
                      className="test-button"
                    >
                      Test
                    </button>
                  </div>
                  
                  {/* UK KYC */}
                  <div className="endpoint-item">
                    <div className="endpoint-code">
                      <span className="method">POST</span>
                      <span className="url">/uk/verify/kyc</span>
                    </div>
                    <button 
                      onClick={() => handleGetKYC('uk')} 
                      disabled={!session_id}
                      className="test-button"
                    >
                      Test
                    </button>
                  </div>
                  
                  {/* Canada KYC */}
                  <div className="endpoint-item">
                    <div className="endpoint-code">
                      <span className="method">POST</span>
                      <span className="url">/ca/verify/kyc</span>
                    </div>
                    <button 
                      onClick={() => handleGetKYC('ca')} 
                      disabled={!session_id}
                      className="test-button"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Create Assertion & Get Access Token (Combined) */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Create Assertion & Get Access Token</h4>
                  <p className="api-description">Creates JWT assertion and immediately requests access token from OAuth2 endpoint. This combines both steps into one operation.</p>
                </div>
                <div className="endpoint-item">
                  <div className="endpoint-code">
                    <span className="method">POST</span>
                    <span className="url">/oauth2/token → /v1/oauth2/token</span>
                  </div>
                  <button
                    onClick={handleCreateClientAssertion}
                    disabled={isAssertionLoading}
                    className="test-button"
                  >
                    {isAssertionLoading ? 'Processing...' : 'Create & Get Token'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
