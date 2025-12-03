import React, { useState, useEffect } from 'react'
import './PasswordProtection.css'

const PasswordProtection = ({ children }) => {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  // Check if already authenticated in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('geoserver_auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Get password from environment variable or use default
    // In production, you'd want to set this via GitHub Secrets or environment
    const correctPassword = import.meta.env.VITE_SITE_PASSWORD || 'carbon2025'

    if (password === correctPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('geoserver_auth', 'authenticated')
      setPassword('')
      setAttempts(0)
    } else {
      setAttempts(prev => prev + 1)
      setError(`Incorrect password. ${3 - attempts > 0 ? `${3 - attempts} attempts remaining.` : 'Please refresh the page.'}`)
      setPassword('')
      
      if (attempts >= 2) {
        // After 3 failed attempts, require page refresh
        setTimeout(() => {
          setError('Too many failed attempts. Please refresh the page to try again.')
        }, 1000)
      }
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="password-protection">
      <div className="password-container">
        <div className="password-header">
          <h2>🔒 Protected Site</h2>
          <p>Please enter the password to access this site</p>
        </div>
        <form onSubmit={handleSubmit} className="password-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="password-input"
            disabled={attempts >= 3}
          />
          {error && (
            <div className="password-error">{error}</div>
          )}
          <button 
            type="submit" 
            className="password-button"
            disabled={attempts >= 3 || !password.trim()}
          >
            {attempts >= 3 ? 'Please Refresh Page' : 'Access Site'}
          </button>
        </form>
        {attempts >= 3 && (
          <p className="password-help">
            Too many failed attempts. Please refresh the page.
          </p>
        )}
      </div>
    </div>
  )
}

export default PasswordProtection

