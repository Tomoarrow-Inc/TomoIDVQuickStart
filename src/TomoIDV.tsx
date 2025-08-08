// import { ConnectionStatus, WebhookStatus, Signin, StartTomoIDV } from 'tomo-idv-client';
import { useState } from 'react';
import { ConnectionStatus, WebhookStatus, Signin, StartTomoIDV } from './modules/tomo-idv-client';
import { getApiEndpoints, getCurrentApiEnvironment } from './ApiConfig';


interface TomoIDVClientProps { 
  // connection_status: ConnectionStatus;
  // session_id: string | null;
}

export default function TomoIDVClient() {
  const [session_id, setSessionId] = useState<string | null>(null);
  const [connection_status, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  // API 설정 가져오기
  const apiEndpoints = getApiEndpoints();
  const currentEnvironment = getCurrentApiEnvironment();
  
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center mb-8">TomoIDV Quick Start Guide</h1>
      
      {/* Step 1: Login */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 1: Login</h2>
        <p className="text-gray-600 mb-4">
          로그인 버튼을 클릭하여 인증 절차를 시작합니다.
        </p>
        <Signin setConnectionStatus={setConnectionStatus} setSessionId={setSessionId}
          className="w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150"
          label='로그인'
        />
      </div>

      {/* Step 2: Session Info and Monitor */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 2: Session 정보 및 연결 상태</h2>
        <p className="text-gray-600 mb-2">
          로그인 완료 후 발급된 세션 정보입니다. API 접근에 필요한 중요한 값입니다.
        </p>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Connection Status Monitor</h3>
          <WebhookStatus session_id={session_id} connectionStatus={connection_status} />
        </div>
      </div>

      {/* Step 3: IDV Process */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 3: 고객 확인 절차</h2>
        <p className="text-gray-600 mb-4">
          IDV(Identity Verification) 버튼을 클릭하여 고객 확인 절차를 진행합니다.
          <br />
          <span className="text-sm text-blue-600 mt-1 block">
            * Session ID가 발급된 후에만 IDV 버튼이 활성화됩니다.
          </span>
        </p>
        <StartTomoIDV
          session_id={session_id}
          className={`w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white transition duration-150 ${
            session_id 
              ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          label='고객 확인 시작'
        />
      </div>

      {/* Step 4: Session Verification */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 4: 세션 유효성 검증</h2>
        <p className="text-gray-600 mb-4">
          현재 세션이 유효한지 확인합니다.
        </p>
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Environment:</strong> {currentEnvironment} | 
          <strong>Endpoint:</strong> {apiEndpoints.verifySessionEndpoint}
        </div>
        <button 
          onClick={() => {
            console.log('Session ID:', session_id);
            console.log('Environment:', currentEnvironment);
            console.log('Verify Session Endpoint:', apiEndpoints.verifySessionEndpoint);
            
            fetch(apiEndpoints.verifySessionEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id })
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
            })
            .catch(err => {
                console.error(err);
            });
          }}
          disabled={!session_id}
          className={`w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white transition duration-150 ${
            session_id 
              ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          세션 검증
        </button>
      </div>

      {/* Step 5: KYC Store */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 5: KYC 저장</h2>
        <p className="text-gray-600 mb-4">
          고객의 KYC 정보를 저장소에 저장합니다.
        </p>
        <button 
          onClick={() => {
            console.log(session_id);
            fetch(config.storeJpKycEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id })
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
            })
            .catch(err => {
                console.error(err);
            });
          }}
          disabled={!session_id}
          className={`w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white transition duration-150 ${
            session_id 
              ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          KYC 저장
        </button>
      </div>

      {/* Step 6: KYC Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Step 6: KYC 정보 조회</h2>
        <p className="text-gray-600 mb-4">
          고객의 KYC 정보를 조회합니다. Production 환경에서는 보안을 위해 Hash 값으로 제공됩니다.
        </p>
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Environment:</strong> {currentEnvironment} | 
          <strong>Endpoint:</strong> {apiEndpoints.resultsEndpoint}
        </div>
        <button 
          onClick={() => {
              console.log('Session ID:', session_id);
              console.log('Environment:', currentEnvironment);
              console.log('Results Endpoint:', apiEndpoints.resultsEndpoint);
              
              fetch(apiEndpoints.resultsEndpoint, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ session_id })
              })
                  .then(res => res.json())
                  .then(data => {
                      console.log(JSON.stringify(data, null, 2));
                  })
                  .catch(err => {
                      console.error(err);
                  });
          }}
          disabled={!session_id}
          className={`w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white transition duration-150 ${
            session_id 
              ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          KYC 정보 조회
        </button>
      </div>
    </div>
  );
}
