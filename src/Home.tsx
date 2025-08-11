import { useState } from 'react';
import { ConnectionStatus, TomoIDV } from './modules/tomo-idv-client';
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
      await TomoIDV.verifySession(session_id);
    } catch (error) {
      console.error('Session verification failed:', error);
    }
  };

  const handleGetKYC = async () => {
    if (!session_id) return;
    try {
      const result = await TomoIDV.getResult(session_id);
      setVerificationResult(result);
      // Check if verification is completed based on result
      if (result && result.status === 'completed') {
        setIsIDVCompleted(true);
      }
    } catch (error) {
      console.error('KYC retrieval failed:', error);
    }
  };

  const handlePurchase = () => {
    if (isIDVCompleted) {
      alert('Purchase completed! Thank you for your order.');
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
          {/* Product Section - Simplified */}
          <div className="product-section">
            <div className="product-card">
              <div className="product-image">
                <div className="product-info">
                  <div className="product-icon">📱</div>
                  <h2 className="product-title">iPhone 15 Pro Max</h2>
                  <p className="product-subtitle">Premium Smartphone</p>
                </div>
              </div>
              <div className="product-details">
                <div className="product-header">
                  <div>
                    <h3 className="product-name">iPhone 15 Pro Max</h3>
                    <p className="product-specs">256GB • Natural Titanium</p>
                  </div>
                  <div className="product-price">
                    <div className="price">$1,199</div>
                    <div className="shipping">Free Shipping</div>
                  </div>
                </div>
                <div className="product-features">
                  <div className="feature">
                    <div className="feature-dot green"></div>
                    In Stock
                  </div>
                  <div className="feature">
                    <div className="feature-dot blue"></div>
                    Secure Payment Required
                  </div>
                  <div className="feature">
                    <div className="feature-dot purple"></div>
                    Identity Verification Required
                  </div>
                </div>
                <button 
                  onClick={handlePurchase}
                  disabled={!isIDVCompleted}
                  className="purchase-button"
                >
                  {isIDVCompleted ? 'Purchase Now - $1,199' : 'Complete IDV to Purchase'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Panel - Prominent */}
          <div className="action-panel">
            {/* Login Section */}
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

            {/* IDV Section */}
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

            {/* Developer Tools Section */}
            <div className="utility-section">
              <h3 className="section-title">Developer Tools</h3>
              
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

        {/* Results and Developer Info Panel */}
        <div className="info-panel">
          {verificationResult && (
            <div className="result-card">
              <h3 className="result-title">
                <div className="status-icon green"></div>
                Verification Result
              </h3>
              <div className="result-content">
                <pre className="result-json">
                  {JSON.stringify(verificationResult, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="dev-info-card">
            <h3 className="dev-info-title">
              <div className="status-icon purple"></div>
              Developer Info
            </h3>
            <div className="dev-info-content">
              <div className="feature-section">
                <h4 className="feature-title">🔐 Authentication Flow</h4>
                <p>Establishes secure WebSocket connection with TomoIDV service. Returns session ID for subsequent operations.</p>
              </div>
              
              <div className="feature-section">
                <h4 className="feature-title">🆔 Identity Verification</h4>
                <p>Opens popup window for user to complete KYC process. Supports document upload, face verification, and liveness detection.</p>
              </div>
              
              <div className="feature-section">
                <h4 className="feature-title">📊 Session Management</h4>
                <p>Verify session status and retrieve KYC results using session ID. Real-time status updates via WebSocket connection.</p>
              </div>
              
              <div className="feature-section">
                <h4 className="feature-title">🔗 Webhook Integration</h4>
                <p>Receive real-time notifications when verification status changes. Configure webhook endpoints for production use.</p>
              </div>
              
              <div className="feature-section">
                <h4 className="feature-title">🛡️ Security Features</h4>
                <p>End-to-end encryption, secure token management, and compliance with KYC/AML regulations.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
