import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '5rem', fontWeight: 700, color: 'var(--border2)', marginBottom: '1rem' }}>
        404
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', color: 'var(--text2)', marginBottom: '0.5rem' }}>
        Page not found
      </div>
      <div style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist.
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        ← Back to home
      </button>
    </div>
  )
}
