import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api, type Person, type Relationship } from './api'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'

type FormData = {
  firstName: string
  lastName: string
  birthDate: string
  deathDate: string
  nationality: string
  notes: string
}

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  deathDate: '',
  nationality: '',
  notes: '',
}

function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(initialForm)
  const [fromPersonId, setFromPersonId] = useState('')
  const [toPersonId, setToPersonId] = useState('')
  const [relType, setRelType] = useState<'PARENT' | 'SPOUSE' | 'SIBLING' | 'CHILD'>('PARENT')
  const [query, setQuery] = useState('')

  const load = async () => {
    const [p, r] = await Promise.all([api.people(), api.relationships()])
    setPeople(p)
    setRelationships(r)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      people.filter(
        (p) =>
          `${p.firstName} ${p.lastName ?? ''}`.toLowerCase().includes(query.toLowerCase()) ||
          p.nationality.toLowerCase().includes(query.toLowerCase()),
      ),
    [people, query],
  )

  const nodes: Node[] = filtered.map((p, idx) => {
    const highlighted =
      selectedId === p.id ||
      relationships.some((r) =>
        selectedId ? (r.fromPersonId === selectedId || r.toPersonId === selectedId) && (r.fromPersonId === p.id || r.toPersonId === p.id) : false,
      )

    return {
      id: p.id,
      data: { label: `${p.firstName} ${p.lastName ?? ''}`.trim() },
      position: { x: (idx % 6) * 220, y: Math.floor(idx / 6) * 140 },
      style: {
        border: highlighted ? '2px solid #7c3aed' : '1px solid #ddd',
        borderRadius: 12,
        padding: 8,
        background: highlighted ? '#f3e8ff' : '#fff',
      },
    }
  })

  const edges: Edge[] = relationships
    .filter((r) => filtered.some((p) => p.id === r.fromPersonId || p.id === r.toPersonId))
    .map((r) => {
      const highlighted = selectedId && (r.fromPersonId === selectedId || r.toPersonId === selectedId)
      return {
        id: r.id,
        source: r.fromPersonId,
        target: r.toPersonId,
        label: r.type,
        animated: !!highlighted,
        style: { stroke: highlighted ? '#7c3aed' : '#999', strokeWidth: highlighted ? 3 : 1.5 },
      }
    })

  const submitPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createPerson({
      firstName: form.firstName,
      lastName: form.lastName || null,
      birthDate: form.birthDate || null,
      deathDate: form.deathDate || null,
      nationality: form.nationality,
      notes: form.notes || null,
    })
    setForm(initialForm)
    await load()
  }

  const submitRelationship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromPersonId || !toPersonId) return
    await api.createRelationship({ fromPersonId, toPersonId, type: relType })
    await load()
  }

  return (
    <div className="layout">
      <aside className="panel">
        <h2>Family Tree</h2>
        <input placeholder="Search name or nationality" value={query} onChange={(e) => setQuery(e.target.value)} />

        <h3>Add person</h3>
        <form onSubmit={submitPerson}>
          <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input placeholder="Last name (optional)" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input type="date" placeholder="Birth date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <input type="date" placeholder="Death date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} />
          <input required placeholder="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit">Add person</button>
        </form>

        <h3>Add relationship</h3>
        <form onSubmit={submitRelationship}>
          <select value={fromPersonId} onChange={(e) => setFromPersonId(e.target.value)}>
            <option value="">From person</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{`${p.firstName} ${p.lastName ?? ''}`}</option>
            ))}
          </select>
          <select value={toPersonId} onChange={(e) => setToPersonId(e.target.value)}>
            <option value="">To person</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{`${p.firstName} ${p.lastName ?? ''}`}</option>
            ))}
          </select>
          <select value={relType} onChange={(e) => setRelType(e.target.value as any)}>
            <option value="PARENT">PARENT</option>
            <option value="CHILD">CHILD</option>
            <option value="SPOUSE">SPOUSE</option>
            <option value="SIBLING">SIBLING</option>
          </select>
          <button type="submit">Connect</button>
        </form>
      </aside>

      <main className="graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          onNodeClick={(_, node) => setSelectedId(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </main>
    </div>
  )
}

export default App
