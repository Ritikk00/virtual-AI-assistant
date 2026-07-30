import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Customize from './pages/Customize';
import Customize2 from './pages/Customize2';
import Home from './pages/Home';
import { useContext } from 'react';
import { userdatacontext } from './context/UserContext';

function App() {
  const { userdata, loading } = useContext(userdatacontext);
  const isAssistantReady = Boolean(userdata?.assistantname || userdata?.assistantimage);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050814] text-white">
        <div className="text-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Loading assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={userdata ? <Navigate to={isAssistantReady ? '/home' : '/customize'} /> : <Navigate to="/signin" />}
        />

        <Route path="/home" element={userdata ? <Home /> : <Navigate to="/signin" replace />} />

        <Route path="/signin" element={!userdata ? <Signin /> : <Navigate to={isAssistantReady ? '/home' : '/customize'} />} />
        <Route path="/signup" element={!userdata ? <Signup /> : <Navigate to="/customize" />} />

        <Route path="/customize" element={userdata ? <Customize /> : <Navigate to="/signup" />} />
        <Route path="/customize2" element={userdata ? <Customize2 /> : <Navigate to="/signup" />} />
      </Routes>
    </>
  )
}

export default App