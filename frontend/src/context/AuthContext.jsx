import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password })
    const { token, user: userData } = response.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (email, password) => {
    const response = await authAPI.register({ email, password })
    const userData = response.data.data
    await login(email, password)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const deleteAccount = async () => {
    await authAPI.deleteMe()
    logout()
  }

  const updateUser = async (data) => {
    const response = await authAPI.updateMe(data)
    const updatedUser = response.data.data
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    return updatedUser
  }

  const forgotPassword = async (email) => {
    return authAPI.forgotPassword({ email })
  }

  const resetPassword = async (token, password) => {
    return authAPI.resetPassword({ token, password })
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
      deleteAccount,
      updateUser,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
