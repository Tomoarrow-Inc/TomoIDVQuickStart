import { useState } from 'react';
// import { ConnectionStatus, TomoIDV } from './modules/tomo-idv-client';
import { ConnectionStatus, TomoIDV } from 'tomo-idv-client';
import './Home.css';

export default function TomoIDVClient() {
  const [session_id, setSessionId] = useState<string | null>(null);
  const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isIDVCompleted, setIsIDVCompleted] = useState(false);

  // React Hook calls at the top level
  const { establishConnection } = TomoIDV.useTomoAuth({
    onConnectionStatusChange: setConnectionStatus,
    onSessionIdChange: setSessionId
  });
  const { openTomoIDVPopup } = TomoIDV.useTomoIDV();

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
                  Start Identity Verification
                </button>
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
                  {verificationResult ? (
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
                  ) : (
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
