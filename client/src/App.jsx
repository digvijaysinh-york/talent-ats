/**
 * Top-level route table for the SPA: home (upload + results) and candidate detail by `id`.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import CandidateDetailPage from './pages/CandidateDetailPage.jsx';
import HomePage from './pages/HomePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/candidates/:id" element={<CandidateDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
