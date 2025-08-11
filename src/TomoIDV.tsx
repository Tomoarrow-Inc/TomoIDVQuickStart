import { useState } from 'react';
import { ConnectionStatus, TomoIDV } from './modules/tomo-idv-client';
import './TomoIDV.css';

export default function TomoIDVClient() {
  const [session_id, setSessionId] = useState<string | null>(null);
  const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // React Hook을 컴포넌트 최상위 레벨에서 호출
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
    if (session_id) {
      openTomoIDVPopup(session_id);
    }
  };

  const handleVerifySession = async () => {
    if (session_id) {
      try {
        const result = await TomoIDV.verifySession(session_id);
        setVerificationResult(result);
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    }
  };

  const handleGetKYC = async () => {
    if (session_id) {
      try {
        const result = await TomoIDV.getResult(session_id);
        console.log('KYC Result:', result);
        setVerificationResult(result);
      } catch (error) {
        console.error('KYC retrieval failed:', error);
      }
    }
  };

  return (
    <div className="tomo-idv-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">🛍️ ShopDemo</h1>
          </div>
          <div className="header-right">
            <div className="connection-status">
              {connection_status === 'connected' ? (
                <span className="status-connected">
                  <div className="status-dot connected"></div>
                  Connected
                </span>
              ) : (
                <span className="status-disconnected">
                  <div className="status-dot disconnected"></div>
                  Disconnected
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          
          {/* Left Column - Product Demo */}
          <div className="product-section">
            <div className="product-card">
              {/* Product Image */}
              <div className="product-image">
                <div className="product-info">
                  <div className="product-icon">📱</div>
                  <h2 className="product-title">Premium Smartphone</h2>
                  <p className="product-subtitle">Latest Model - Limited Edition</p>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="product-details">
                <div className="product-header">
                  <div>
                    <h3 className="product-name">iPhone 15 Pro Max</h3>
                    <p className="product-specs">256GB - Titanium</p>
                  </div>
                  <div className="product-price">
                    <div className="price">₩1,850,000</div>
                    <div className="shipping">Free Shipping</div>
                  </div>
                </div>
                
                <div className="product-features">
                  <div className="feature">
                    <span className="feature-dot green"></span>
                    In Stock - Ready to Ship
                  </div>
                  <div className="feature">
                    <span className="feature-dot blue"></span>
                    Secure Payment Required
                  </div>
                  <div className="feature">
                    <span className="feature-dot purple"></span>
                    Identity Verification Required
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  {!session_id ? (
                    <button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className={`login-button ${isLoading ? 'loading' : ''}`}
                    >
                      {isLoading ? (
                        <span className="loading-content">
                          <div className="spinner"></div>
                          Connecting...
                        </span>
                      ) : (
                        '🔐 Secure Login & Identity Verification'
                      )}
                    </button>
                  ) : (
                    <div className="idv-buttons">
                      <button
                        onClick={handleStartIDV}
                        className="idv-button primary"
                      >
                        🆔 Start Identity Verification
                      </button>
                      <button
                        onClick={handleVerifySession}
                        className="idv-button secondary"
                      >
                        ✅ Verify Session
                      </button>
                      <button
                        onClick={handleGetKYC}
                        className="idv-button tertiary"
                      >
                        📋 Get KYC Information
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status Panel */}
          <div className="status-panel">
            {/* Session Status */}
            <div className="status-card">
              <h3 className="status-title">
                <span className="status-icon blue"></span>
                Session Status
              </h3>
              <div className="status-content">
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className={`status-value ${connection_status === 'connected' ? 'connected' : 'disconnected'}`}>
                    {connection_status}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Session ID:</span>
                  <span className="session-id">
                    {session_id || 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div className="result-card">
                <h3 className="result-title">
                  <span className="status-icon green"></span>
                  Verification Result
                </h3>
                <div className="result-content">
                  <pre className="result-json">
                    {JSON.stringify(verificationResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Developer Info */}
            <div className="dev-info-card">
              <h3 className="dev-info-title">
                <span className="status-icon purple"></span>
                Developer Info
              </h3>
              <div className="dev-info-content">
                <p>• TomoIDV Quick Start Demo</p>
                <p>• Test Identity Verification Flow</p>
                <p>• Check Console for API Logs</p>
                <p>• Session Management Demo</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
