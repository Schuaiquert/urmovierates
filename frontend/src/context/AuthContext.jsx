import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, usersAPI } from '../services/api'

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

  const deleteAccount = async (userId) => {
    await authAPI.deleteAccount(userId)
    logout()
  }

  const updateUser = async (userId, data) => {
    const response = await usersAPI.update(userId, data)
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