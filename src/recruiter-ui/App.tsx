import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import CandidatePortal from './pages/CandidatePortal';
import RecruiterPortal from './pages/RecruiterPortal';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/candidate" element={<CandidatePortal />} />
        <Route path="/recruiter" element={<RecruiterPortal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
