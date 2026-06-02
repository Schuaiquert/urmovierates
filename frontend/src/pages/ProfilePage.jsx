import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, logout, deleteAccount, updateUser } = useAuth()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditName, setShowEditName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user.name) {
      setShowEditName(false)
      return
    }
    setIsUpdatingName(true)
    try {
      await updateUser(user.id, { name: newName.trim() })
      setShowEditName(false)
    } catch (error) {
      console.error('Failed to update name:', error)
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount(user.id)
      navigate('/login')
    } catch (error) {
      console.error('Failed to delete account:', error)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você precisa estar logado para ver seu perfil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Minha Conta</h1>

      <div className="max-w-2xl">
        {/* User Info Card */}
        <div className="bg-dark-100 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Informações do Perfil</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {showEditName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-dark-300 text-gray-100 rounded-lg px-3 py-2 flex-1 border border-gray-600 focus:border-primary-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdatingName}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white disabled:opacity-50"
                    >
                      {isUpdatingName ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => { setShowEditName(false); setNewName(user.name || '') }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium text-gray-100">
                      {user.name || 'Usuário'}{user.role === 'ADMIN' && ' (ADM)'}
                    </p>
                    <button
                      onClick={() => { setShowEditName(true); setNewName(user.name || '') }}
                      className="p-1 hover:text-primary-400 text-gray-400 transition-colors"
                      title="Editar nome"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Tipo de conta</p>
              <p className="text-gray-200 font-medium">
                {user.role === 'ADMIN' ? 'Administrador' : 'Usuário comum'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-dark-100 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Ações</h2>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <span className="text-xl">🚪</span>
              <div>
                <p className="text-gray-100 font-medium">Sair da conta</p>
                <p className="text-gray-400 text-sm">Faça logout para sair</p>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-left border border-red-500/30"
            >
              <span className="text-xl">🗑️</span>
              <div>
                <p className="text-red-400 font-medium">Excluir conta</p>
                <p className="text-gray-400 text-sm">Remover sua conta permanentemente</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Zona de Perigo</h2>
          <p className="text-gray-400 text-sm mb-4">
            A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados,
            incluindo avaliações e favoritos, serão removidos.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-100 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir sua conta? Esta ação é irreversível.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}