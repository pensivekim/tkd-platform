'use client'

import { useState, useEffect, FormEvent } from 'react'
import { captureException } from '@/lib/sentry'
import { Plus, X, Trash2 } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  manager:    '중간관리자',
  staff:      '직원',
  instructor: '사범',
}
const ROLE_COLOR: Record<string, string> = {
  manager:    'bg-yellow-500/15 text-yellow-400',
  staff:      'bg-sky-500/15 text-sky-400',
  instructor: 'bg-purple-500/15 text-purple-400',
}

const inputCls = 'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 disabled:opacity-50 transition-colors'
const selectCls = inputCls + ' [&>option]:bg-[#0E0E18]'

export default function TeamSection() {
  const [members, setMembers]   = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [msg, setMsg]           = useState('')
  const [form, setForm]         = useState({ name: '', email: '', role: 'staff', password: '' })
  const [saving, setSaving]     = useState(false)

  async function loadTeam() {
    try {
      const res  = await fetch('/api/dashboard/team')
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch (err) {
      captureException(err, { action: 'load_team' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeam() }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    setSaving(true)
    try {
      const res  = await fetch('/api/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? '오류가 발생했습니다.'); return }
      setMsg('✓ 팀원이 추가되었습니다.')
      setForm({ name: '', email: '', role: 'staff', password: '' })
      await loadTeam()
      setTimeout(() => { setShowAdd(false); setMsg('') }, 1200)
    } catch (err) {
      captureException(err, { action: 'add_team_member' })
      setMsg('서버 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`'${name}' 계정을 삭제하시겠습니까?`)) return
    setDeleting(userId)
    try {
      const res = await fetch(`/api/dashboard/team/${userId}`, { method: 'DELETE' })
      if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== userId))
    } catch (err) {
      captureException(err, { action: 'delete_team_member' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-[#F0F0F5]">팀원 관리</h2>
        <button
          onClick={() => { setShowAdd((v) => !v); setMsg('') }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border-none ${
            showAdd
              ? 'bg-white/[0.06] text-[#909098] hover:bg-white/[0.09]'
              : 'bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/25 hover:bg-[#E63946]/15'
          }`}
        >
          {showAdd ? <X size={12} /> : <Plus size={12} />}
          {showAdd ? '취소' : '팀원 추가'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#E63946]/[0.04] border border-[#E63946]/15 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold text-[#E63946]">새 팀원 계정 만들기</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#909098] mb-1.5">이름 *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[11px] text-[#909098] mb-1.5">역할 *</label>
              <select className={selectCls} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="manager">중간관리자</option>
                <option value="staff">직원</option>
                <option value="instructor">사범</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#909098] mb-1.5">이메일 *</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[11px] text-[#909098] mb-1.5">초기 비밀번호 * (6자 이상)</label>
              <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
          </div>

          {msg && (
            <p className={`text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-[#E63946]'}`}>{msg}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer border-none"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? '추가 중…' : '팀원 추가'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#606070]">불러오는 중…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-[#404050] text-center py-5">
          아직 추가된 팀원이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#F0F0F5]">{m.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ROLE_COLOR[m.role] ?? 'bg-white/[0.06] text-[#909098]'}`}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </div>
                <p className="text-xs text-[#606070] mt-0.5">{m.email}</p>
              </div>
              <button
                onClick={() => handleDelete(m.id, m.name)}
                disabled={deleting === m.id}
                className="p-1.5 rounded-lg text-[#606070] hover:text-[#E63946] hover:bg-[#E63946]/[0.08] transition-colors disabled:opacity-40 cursor-pointer bg-transparent border-none"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#303040] mt-4 pt-3 border-t border-white/[0.05]">
        팀원은 도장 내 기능을 역할별로 사용할 수 있습니다.
      </p>
    </div>
  )
}
