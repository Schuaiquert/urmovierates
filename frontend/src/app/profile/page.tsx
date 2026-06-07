'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Modal } from '@/components/common';

export default function ProfilePage() {
  const { user, logout, deleteAccount, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Acesso Negado</h1>
        <p className="text-gray-400 mb-6">Você precisa estar logado para ver seu perfil.</p>
        <Button onClick={() => router.push('/login')}>Entrar</Button>
      </div>
    );
  }

  const saveName = async () => {
    if (!newName.trim() || newName === user.name) { setEditing(false); return; }
    setSaving(true);
    try { await updateUser({ name: newName.trim() }); setEditing(false); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try { await deleteAccount(); router.push('/login'); }
    catch (e) { console.error(e); setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Minha Conta</h1>
      <div className="max-w-2xl">
        <div className="bg-dark-100 rounded-xl p-6 mb-6 border border-white/5">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Informações do Perfil</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold text-white">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                    <Button onClick={saveName} loading={saving}>Salvar</Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setNewName(user.name); }}>Cancelar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium text-gray-100">
                      {user.name || 'Usuário'}{user.role === 'ADMIN' && ' (ADM)'}
                    </p>
                    <button onClick={() => { setEditing(true); setNewName(user.name || ''); }}
                      className="p-1 text-gray-400 hover:text-primary-400 transition-colors" title="Editar nome" aria-label="Editar nome">
                      <Pencil className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Tipo de conta</p>
              <p className="text-gray-200 font-medium">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário comum'}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-6 mb-6 border border-white/5">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Ações</h2>
          <div className="space-y-3">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left">
              <LogOut className="w-5 h-5 text-gray-400" strokeWidth={1.75} />
              <div>
                <p className="text-gray-100 font-medium">Sair da conta</p>
                <p className="text-gray-400 text-sm">Faça logout para sair</p>
              </div>
            </button>
            <h2 className="text-lg font-semibold text-red-400 mb-2 pt-4">Zona de Perigo</h2>
            <p className="text-gray-400 text-sm mb-2">
              A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados,
              incluindo avaliações e favoritos, serão removidos.
            </p>
            <button onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-left border border-red-500/30">
              <Trash2 className="w-5 h-5 text-red-400" strokeWidth={1.75} />
              <div>
                <p className="text-red-400 font-medium">Excluir conta</p>
                <p className="text-gray-400 text-sm">Remover sua conta permanentemente</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Confirmar Exclusão">
        <div className="p-6">
          <p className="text-gray-400 mb-6">Tem certeza que deseja excluir sua conta? Esta ação é irreversível.</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} className="flex-1">Cancelar</Button>
            <Button onClick={doDelete} loading={deleting} className="flex-1 !bg-red-600 hover:!bg-red-700">Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
