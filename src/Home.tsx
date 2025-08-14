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

  const handleGetKYC = async () => {
    if (!session_id) return;
    try {
      const response = await fetch(`https://test.tomopayment.com/v1/results`,
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
      console.log('KYC result:', JSON.stringify(data, null, 2));
      setVerificationResult(data);
      
      // Check if verification is completed based on result
      if (data && data.kycResultKycData_status === 'success') {
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
          </div>

          {/* Right Side - Developer Tools */}
          <div className="right-panel">
            {/* Developer Tools Section */}
            <div className="utility-section">
              <h3 className="section-title">Built-in APIs</h3>
              
              {/* Verify Session */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Verify Session</h4>
                  <div className="endpoint-info">
                    <span className="endpoint-method">POST</span>
                    <span className="endpoint-url">/api/verify-session</span>
                  </div>
                </div>
                <p className="api-description">Validates the current session and returns session status information</p>
                <button 
                  onClick={handleVerifySession} 
                  disabled={!session_id}
                  className="utility-button"
                >
                  Verify Session
                </button>
              </div>
              
              {/* Get KYC Data */}
              <div className="api-section">
                <div className="api-header">
                  <h4 className="api-title">Get KYC Data</h4>
                  <div className="endpoint-info">
                    <span className="endpoint-method">GET</span>
                    <span className="endpoint-url">/api/get-result</span>
                  </div>
                </div>
                <p className="api-description">Retrieves KYC verification results and user data</p>
                <button 
                  onClick={handleGetKYC} 
                  disabled={!session_id}
                  className="utility-button"
                >
                  Get KYC Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Results Panel - Full Width Bottom */}
        <div className="results-panel">
          <div className="results-container">
            <div className="result-card">
              <h3 className="result-title">
                <div className="status-icon green"></div>
                Response Result
              </h3>
              <div className="result-content">
                {verificationResult ? (
                  <div className="json-display">
                    <div className="json-header">
                      <span className="json-type">JSON Response</span>
                      <button 
                        className="copy-button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(verificationResult, null, 2));
                        }}
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="json-content">
                      <pre className="result-json">
                        {JSON.stringify(verificationResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="no-result">
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
      </main>
    </div>
  );
}
