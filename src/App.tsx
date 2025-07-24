import './App.css';
// import { ConnectionStatus, SessionWebHook } from 'tomo-idv-client';
import { ConnectionStatus, SessionWebHook } from './modules/tomo-idv-client';
import TomoIDVClient from './TomoIDV';


function App() {

  function webhookHelper(connection_status: ConnectionStatus, session_id: string | null) {
    return (
      <TomoIDVClient connection_status={connection_status} session_id={session_id} />
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="flex space-x-4 items-center">
          <div>
            <SessionWebHook >
              { webhookHelper }
            </SessionWebHook>
          </div>
        </div>
      </header>
    </div>
  );
}


export default App;
