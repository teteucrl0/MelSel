import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getRoles, setRoles } from '../services/authUtil'
import userService from '../services/userService'
import { validateLocalSession } from '../utils/authSession'

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { valid: sessionValid, expired: sessionExpired } = validateLocalSession()
  const location = useLocation()
  const [roles, setRolesState] = useState(() => getRoles())

  useEffect(() => {
    if (!sessionValid) return undefined
    let cancelled = false
    userService
      .getProfile()
      .then((profile) => {
        if (cancelled || !profile?.roles) return
        setRoles(profile.roles)
        setRolesState(profile.roles)
      })
      .catch(() => {})
    const onRoles = () => setRolesState(getRoles())
    window.addEventListener('mellsell-roles-updated', onRoles)
    return () => {
      cancelled = true
      window.removeEventListener('mellsell-roles-updated', onRoles)
    }
  }, [sessionValid])

  if (!sessionValid) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, sessionExpired }}
        replace
      />
    )
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const ok = allowedRoles.some((r) => roles.some((x) => x === r || x === `ROLE_${r}`))
    if (!ok) return <Navigate to="/" replace state={{ accessDenied: true }} />
  }
  return children
}