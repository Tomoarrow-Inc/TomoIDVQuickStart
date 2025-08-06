import './App.css';
// import { ConnectionStatus } from 'tomo-idv-client';
import { ConnectionStatus } from './modules/tomo-idv-client';
import TomoIDVClient from './TomoIDV';


function App() {

  return (
    <div className="App">
      <header className="App-header">
        <div className="flex space-x-4 items-center">
          <div>
            <TomoIDVClient />
          </div>
        </div>
      </header>
    </div>
  );
}


export default App;
