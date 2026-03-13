'use client'

import { useState, useEffect, FormEvent } from 'react'

interface Dojang {
  id: string; name: string; owner_name: string; phone: string
  region: string; plan: string; student_count: number; created_at: string
}
interface User {
  id: string; name: string; email: string; role: string; created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  owner: '관장', manager: '중간관리자', staff: '직원', instructor: '사범',
}
const PLAN_COLOR: Record<string, string> = {
  free: '#606070', basic: '#3B82F6', pro: '#E63946',
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#0E0E18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#909098', marginBottom: 5 }}>{label}</label>
      <input {...props} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, color: '#F0F0F5', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#909098', marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#0E0E18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, color: '#F0F0F5', outline: 'none' }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── 탭: 도장 관리 ─────────────────────────────────────────────────────────────
function DojangTab() {
  const [dojangs, setDojangs]         = useState<Dojang[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedDojang, setSelected] = useState<Dojang | null>(null)
  const [dojangUsers, setDojangUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showAddDojang, setShowAddDojang] = useState(false)
  const [addDojangForm, setAddDojangForm] = useState({ dojang_name: '', owner_name: '', email: '', password: '', phone: '', region: '' })
  const [addDojangMsg, setAddDojangMsg]   = useState('')
  const [addDojangLoading, setAddDojangLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', role: 'staff', password: '' })
  const [addUserMsg, setAddUserMsg]   = useState('')
  const [addUserLoading, setAddUserLoading] = useState(false)

  async function loadDojangs() {
    setLoading(true)
    const res = await fetch('/api/admin/dojangs')
    const data = await res.json()
    setDojangs(data.dojangs ?? [])
    setLoading(false)
  }

  async function loadUsers(dojangId: string) {
    setUsersLoading(true)
    const res = await fetch(`/api/admin/users?dojang_id=${dojangId}`)
    const data = await res.json()
    setDojangUsers(data.users ?? [])
    setUsersLoading(false)
  }

  useEffect(() => { loadDojangs() }, [])

  async function handleAddDojang(e: FormEvent) {
    e.preventDefault()
    setAddDojangMsg('')
    setAddDojangLoading(true)
    const res = await fetch('/api/admin/dojangs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addDojangForm) })
    const data = await res.json()
    if (!res.ok) { setAddDojangMsg(data.error ?? '오류'); setAddDojangLoading(false); return }
    setAddDojangMsg('✓ 도장이 추가되었습니다.')
    setAddDojangForm({ dojang_name: '', owner_name: '', email: '', password: '', phone: '', region: '' })
    setAddDojangLoading(false)
    await loadDojangs()
    setTimeout(() => { setShowAddDojang(false); setAddDojangMsg('') }, 1200)
  }

  async function handleAddUser(e: FormEvent) {
    e.preventDefault()
    if (!selectedDojang) return
    setAddUserMsg('')
    setAddUserLoading(true)
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dojang_id: selectedDojang.id, ...addUserForm }) })
    const data = await res.json()
    if (!res.ok) { setAddUserMsg(data.error ?? '오류'); setAddUserLoading(false); return }
    setAddUserMsg('✓ 사용자가 추가되었습니다.')
    setAddUserForm({ name: '', email: '', role: 'staff', password: '' })
    setAddUserLoading(false)
    await loadUsers(selectedDojang.id)
    setTimeout(() => { setShowAddUser(false); setAddUserMsg('') }, 1200)
  }

  function selectDojang(d: Dojang) { setSelected(d); setShowAddUser(false); loadUsers(d.id) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* 왼쪽: 도장 목록 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>도장 목록 ({dojangs.length})</h2>
          <button onClick={() => setShowAddDojang((v) => !v)} style={{ background: '#E63946', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + 도장 추가
          </button>
        </div>

        {showAddDojang && (
          <Card style={{ marginBottom: 14, border: '1px solid rgba(230,57,70,0.25)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#E63946', marginBottom: 14 }}>새 도장 + 관장 계정 생성</p>
            <form onSubmit={handleAddDojang} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="도장명 *" value={addDojangForm.dojang_name} onChange={(e) => setAddDojangForm((p) => ({ ...p, dojang_name: e.target.value }))} required />
                <Input label="관장명 *" value={addDojangForm.owner_name} onChange={(e) => setAddDojangForm((p) => ({ ...p, owner_name: e.target.value }))} required />
                <Input label="이메일 *" type="email" value={addDojangForm.email} onChange={(e) => setAddDojangForm((p) => ({ ...p, email: e.target.value }))} required />
                <Input label="비밀번호 *" type="password" value={addDojangForm.password} onChange={(e) => setAddDojangForm((p) => ({ ...p, password: e.target.value }))} required />
                <Input label="전화번호" value={addDojangForm.phone} onChange={(e) => setAddDojangForm((p) => ({ ...p, phone: e.target.value }))} />
                <Input label="지역" value={addDojangForm.region} onChange={(e) => setAddDojangForm((p) => ({ ...p, region: e.target.value }))} placeholder="예: 서울특별시" />
              </div>
              {addDojangMsg && <p style={{ fontSize: 12, color: addDojangMsg.startsWith('✓') ? '#4ade80' : '#E63946' }}>{addDojangMsg}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddDojang(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#909098', cursor: 'pointer', fontSize: 12 }}>취소</button>
                <button type="submit" disabled={addDojangLoading} style={{ padding: '8px 16px', borderRadius: 8, background: '#E63946', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {addDojangLoading ? '생성 중…' : '도장 생성'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {loading ? <p style={{ color: '#606070', fontSize: 13 }}>불러오는 중…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dojangs.map((d) => (
              <div key={d.id} onClick={() => selectDojang(d)} style={{ background: selectedDojang?.id === d.id ? 'rgba(230,57,70,0.08)' : '#0E0E18', border: `1px solid ${selectedDojang?.id === d.id ? 'rgba(230,57,70,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: PLAN_COLOR[d.plan] ?? '#606070', background: `${PLAN_COLOR[d.plan] ?? '#606070'}18`, padding: '2px 8px', borderRadius: 6 }}>{d.plan.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#606070' }}>
                  <span>관장: {d.owner_name}</span>
                  {d.region && <span>{d.region}</span>}
                  <span>원생 {d.student_count}명</span>
                </div>
              </div>
            ))}
            {dojangs.length === 0 && <p style={{ color: '#404050', fontSize: 13, textAlign: 'center', padding: 20 }}>등록된 도장이 없습니다.</p>}
          </div>
        )}
      </div>

      {/* 오른쪽: 선택 도장 사용자 */}
      <div>
        {selectedDojang ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{selectedDojang.name} · 사용자</h2>
                <p style={{ fontSize: 11, color: '#606070' }}>전화: {selectedDojang.phone || '—'}</p>
              </div>
              <button onClick={() => setShowAddUser((v) => !v)} style={{ background: 'rgba(233,196,106,0.12)', color: '#E9C46A', border: '1px solid rgba(233,196,106,0.3)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                + 사용자 추가
              </button>
            </div>

            {showAddUser && (
              <Card style={{ marginBottom: 14, border: '1px solid rgba(233,196,106,0.2)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#E9C46A', marginBottom: 14 }}>사용자 추가</p>
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Input label="이름 *" value={addUserForm.name} onChange={(e) => setAddUserForm((p) => ({ ...p, name: e.target.value }))} required />
                    <SelectInput label="역할 *" value={addUserForm.role} onChange={(v) => setAddUserForm((p) => ({ ...p, role: v }))} options={[
                      { value: 'owner', label: '관장 (owner)' },
                      { value: 'manager', label: '중간관리자 (manager)' },
                      { value: 'staff', label: '직원 (staff)' },
                      { value: 'instructor', label: '사범 (instructor)' },
                    ]} />
                    <Input label="이메일 *" type="email" value={addUserForm.email} onChange={(e) => setAddUserForm((p) => ({ ...p, email: e.target.value }))} required />
                    <Input label="초기 비밀번호 *" type="password" value={addUserForm.password} onChange={(e) => setAddUserForm((p) => ({ ...p, password: e.target.value }))} required />
                  </div>
                  {addUserMsg && <p style={{ fontSize: 12, color: addUserMsg.startsWith('✓') ? '#4ade80' : '#E63946' }}>{addUserMsg}</p>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowAddUser(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#909098', cursor: 'pointer', fontSize: 12 }}>취소</button>
                    <button type="submit" disabled={addUserLoading} style={{ padding: '8px 16px', borderRadius: 8, background: '#E9C46A', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      {addUserLoading ? '추가 중…' : '추가'}
                    </button>
                  </div>
                </form>
              </Card>
            )}

            {usersLoading ? <p style={{ color: '#606070', fontSize: 13 }}>불러오는 중…</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dojangUsers.map((u) => (
                  <div key={u.id} style={{ background: '#0E0E18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: u.role === 'owner' ? '#E63946' : u.role === 'manager' ? '#E9C46A' : '#7EC8E3', background: u.role === 'owner' ? 'rgba(230,57,70,0.1)' : u.role === 'manager' ? 'rgba(233,196,106,0.1)' : 'rgba(126,200,227,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                      <div style={{ fontSize: 11, color: '#606070', marginTop: 2 }}>{u.email}</div>
                    </div>
                  </div>
                ))}
                {dojangUsers.length === 0 && <p style={{ color: '#404050', fontSize: 13, textAlign: 'center', padding: 20 }}>관장 외 추가 사용자가 없습니다.</p>}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: '#404050', fontSize: 13 }}>
            왼쪽에서 도장을 선택하면 사용자를 관리할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  )
}

// ── 탭: 부관리자 관리 ─────────────────────────────────────────────────────────
function SubManagerTab() {
  const [managers, setManagers] = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const [msg, setMsg]           = useState('')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/platform-managers')
    const data = await res.json()
    setManagers(data.managers ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    setSaving(true)
    const res = await fetch('/api/admin/platform-managers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error ?? '오류'); setSaving(false); return }
    setMsg('✓ 부관리자 계정이 생성되었습니다.')
    setForm({ name: '', email: '', password: '' })
    setSaving(false)
    await load()
    setTimeout(() => { setShowAdd(false); setMsg('') }, 1200)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`'${name}' 계정을 삭제하시겠습니까?`)) return
    setDeleting(id)
    await fetch(`/api/admin/platform-managers?id=${id}`, { method: 'DELETE' })
    setManagers((prev) => prev.filter((m) => m.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>부관리자 계정</h2>
          <p style={{ fontSize: 12, color: '#606070' }}>/admin 페이지에 접근할 수 있는 계정을 추가합니다.</p>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setMsg('') }}
          style={{ background: showAdd ? 'transparent' : '#E63946', color: showAdd ? '#909098' : '#fff', border: showAdd ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          {showAdd ? '취소' : '+ 부관리자 추가'}
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 20, border: '1px solid rgba(230,57,70,0.2)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#E63946', marginBottom: 14 }}>새 부관리자 계정 생성</p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="이름 *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="홍길동" />
              <Input label="이메일 *" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required placeholder="staff@dojang.com" />
            </div>
            <Input label="초기 비밀번호 * (6자 이상)" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
            {msg && <p style={{ fontSize: 12, color: msg.startsWith('✓') ? '#4ade80' : '#E63946' }}>{msg}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, background: saving ? 'rgba(230,57,70,0.4)' : '#E63946', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                {saving ? '생성 중…' : '계정 생성'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p style={{ color: '#606070', fontSize: 13 }}>불러오는 중…</p>
      ) : managers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: '#404050', fontSize: 13 }}>
          등록된 부관리자가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {managers.map((m) => (
            <div key={m.id} style={{ background: '#0E0E18', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(233,196,106,0.12)', color: '#E9C46A', padding: '2px 8px', borderRadius: 6 }}>부관리자</span>
                </div>
                <div style={{ fontSize: 11, color: '#606070' }}>{m.email}</div>
              </div>
              <button
                onClick={() => handleDelete(m.id, m.name)}
                disabled={deleting === m.id}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#606070', cursor: 'pointer' }}
              >
                {deleting === m.id ? '…' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab]     = useState<'dojangs' | 'submanagers'>('dojangs')
  const [isRoot, setIsRoot] = useState(false)

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d: { isRoot?: boolean }) => setIsRoot(!!d.isRoot))
  }, [])

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? '#E63946' : 'transparent',
    color: active ? '#fff' : '#606070',
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>플랫폼 관리</h1>
        <p style={{ fontSize: 13, color: '#606070' }}>전체 도장 및 사용자를 관리합니다.</p>
      </div>

      {/* 탭 — 부관리자 탭은 isRoot만 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, width: 'fit-content' }}>
        <button style={tabStyle(tab === 'dojangs')} onClick={() => setTab('dojangs')}>
          🏠 도장 관리
        </button>
        {isRoot && (
          <button style={tabStyle(tab === 'submanagers')} onClick={() => setTab('submanagers')}>
            👤 부관리자
          </button>
        )}
      </div>

      {tab === 'dojangs' && <DojangTab />}
      {tab === 'submanagers' && isRoot && <SubManagerTab />}
    </div>
  )
}
