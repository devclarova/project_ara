import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Tailwind 사용시 반드시 설정확인

createRoot(document.getElementById('root')!).render(<App />);
