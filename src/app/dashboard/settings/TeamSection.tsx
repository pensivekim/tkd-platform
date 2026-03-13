'use client'

import { useState, useEffect, FormEvent } from 'react'
import { captureException } from '@/lib/sentry'

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
  manager:    '#E9C46A',
  staff:      '#7EC8E3',
  instructor: '#A78BFA',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 13,
  color: '#F0F0F5',
  background: 'rgba(255,255,255,0.04)',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function TeamSection() {
  const [members, setMembers]   = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [msg, setMsg]           = useState('')

  const [form, setForm] = useState({ name: '', email: '', role: 'staff', password: '' })
  const [saving, setSaving] = useState(false)

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
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== userId))
      }
    } catch (err) {
      captureException(err, { action: 'delete_team_member' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{
      background: '#0E0E18',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: 15, color: '#F0F0F5', margin: 0 }}>팀원 관리</h2>
        <button
          onClick={() => { setShowAdd((v) => !v); setMsg('') }}
          style={{
            background: 'rgba(230,57,70,0.1)', color: '#E63946',
            border: '1px solid rgba(230,57,70,0.25)',
            borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {showAdd ? '취소' : '+ 팀원 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{
          background: 'rgba(230,57,70,0.04)',
          border: '1px solid rgba(230,57,70,0.15)',
          borderRadius: 12, padding: '16px',
          marginBottom: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#E63946', margin: 0 }}>새 팀원 계정 만들기</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#909098', marginBottom: 4 }}>이름 *</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#909098', marginBottom: 4 }}>역할 *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle, background: '#0E0E18' }}
              >
                <option value="manager">중간관리자 (manager)</option>
                <option value="staff">직원 (staff)</option>
                <option value="instructor">사범 (instructor)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#909098', marginBottom: 4 }}>이메일 *</label>
              <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#909098', marginBottom: 4 }}>초기 비밀번호 * (6자 이상)</label>
              <input type="password" style={inputStyle} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} />
            </div>
          </div>

          {msg && (
            <p style={{ fontSize: 12, color: msg.startsWith('✓') ? '#4ade80' : '#E63946', margin: 0 }}>{msg}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? 'rgba(230,57,70,0.4)' : '#E63946',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '추가 중…' : '팀원 추가'}
            </button>
          </div>
        </form>
      )}

      {/* 팀원 목록 */}
      {loading ? (
        <p style={{ fontSize: 13, color: '#606070' }}>불러오는 중…</p>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 13, color: '#404050', textAlign: 'center', padding: '20px 0' }}>
          아직 추가된 팀원이 없습니다. 중간관리자, 직원, 사범을 추가해보세요.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                <span style={{
                  marginLeft: 8,
                  fontSize: 10, fontWeight: 700,
                  color: ROLE_COLOR[m.role] ?? '#909098',
                  background: `${ROLE_COLOR[m.role] ?? '#909098'}18`,
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  {ROLE_LABEL[m.role] ?? m.role}
                </span>
                <div style={{ fontSize: 11, color: '#606070', marginTop: 2 }}>{m.email}</div>
              </div>
              <button
                onClick={() => handleDelete(m.id, m.name)}
                disabled={deleting === m.id}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '5px 10px',
                  fontSize: 11, color: '#606070', cursor: 'pointer',
                }}
              >
                {deleting === m.id ? '…' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#303040', marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
        팀원은 도장 내 기능을 역할별로 사용할 수 있습니다. 비밀번호는 팀원이 직접 변경할 수 있습니다.
      </p>
    </div>
  )
}
