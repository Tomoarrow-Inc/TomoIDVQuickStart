import React from 'react';
import './App.css';
import { SessionWebHook, WebhookStatus, Signin, StartTomoIDV } from 'tomo-idv-client';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="flex space-x-4 items-center">

          <SessionWebHook>
            {(connection_status, session_id) => (
              <div className="space-y-4">
                <WebhookStatus session_id={session_id} connectionStatus={connection_status}/>
                <div className="flex space-x-4 items-center">
                  <Signin
                    className="w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white bg-gray-800 hover:bg-[#222] focus:outline-none"
                    label='Custom SignIn Label'
                  />
                  <StartTomoIDV 
                      session_id={session_id}
                      className="w-full py-2.5 px-4 text-sm font-semibold tracking-wider rounded text-white bg-gray-800 hover:bg-[#222] focus:outline-none"
                      label='Custom StartTomoIDV Label'
                  />
                </div>
              </div>
              )}
            </SessionWebHook> 
        </div>
      </header>
    </div>
  );
}

export default App;
