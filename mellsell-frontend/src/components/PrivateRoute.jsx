import React from 'react'
import { Navigate } from 'react-router-dom'
import { hasRole } from '../services/authUtil'

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const ok = allowedRoles.some(r => hasRole(r))
    if (!ok) return <Navigate to="/login" replace />
  }
  return children
}
