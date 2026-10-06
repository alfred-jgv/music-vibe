import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VibePage from './pages/VibePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vibes/:vibeId" element={<VibePage />} />
      </Routes>
    </BrowserRouter>
  );
}