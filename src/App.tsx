import { Toaster } from 'react-hot-toast';
import AppRouter from './components/layout/Router';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AppRouter />
    </>
  );
}

export default App;
