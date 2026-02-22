import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Analyze from './pages/Analyze.jsx'
import History from './pages/History.jsx'
import Status from './pages/Status.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="layout">
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="logo-dot" />
          CodeQA
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>home</NavLink>
          <NavLink to="/analyze" className={({ isActive }) => isActive ? 'active' : ''}>analyze</NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>history</NavLink>
          <NavLink to="/status" className={({ isActive }) => isActive ? 'active' : ''}>status</NavLink>
        </div>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/history" element={<History />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        CodeQA · built with Groq + React · 2025
      </footer>
    </div>
  )
}
