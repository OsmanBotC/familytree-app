import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api, type Gender, type Person, type Relationship } from './api'
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeDragHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'

type FormData = {
  firstName: string
  lastName: string
  birthDate: string
  deathDate: string
  gender: Gender
  nationality: string
  notes: string
}

const PRIORITY_NATIONALITIES = ['Lebanese', 'Syrian', 'Jordanian']
const OTHER_NATIONALITIES = [
  'American', 'Argentinian', 'Australian', 'Brazilian', 'British', 'Canadian', 'Chinese', 'Egyptian', 'French',
  'German', 'Indian', 'Iraqi', 'Italian', 'Japanese', 'Kuwaiti', 'Mexican', 'Moroccan', 'Palestinian',
  'Portuguese', 'Qatari', 'Saudi', 'Spanish', 'Turkish', 'UAE', 'Yemeni',
]
const NATIONALITIES = [...PRIORITY_NATIONALITIES, ...OTHER_NATIONALITIES.sort((a, b) => a.localeCompare(b))]

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  deathDate: '',
  gender: 'UNKNOWN',
  nationality: PRIORITY_NATIONALITIES[0],
  notes: '',
}

const dateOrNull = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : '')

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

  const autoPositions = useMemo(() => {
    const visibleIds = new Set(filtered.map((p) => p.id))
    const levels = new Map<string, number>()
    filtered.forEach((p) => levels.set(p.id, 0))

    const parentToChildren = new Map<string, string[]>()

    relationships.forEach((r) => {
      if (!visibleIds.has(r.fromPersonId) || !visibleIds.has(r.toPersonId)) return
      let parentId: string | null = null
      let childId: string | null = null

      if (r.type === 'PARENT') {
        parentId = r.fromPersonId
        childId = r.toPersonId
      } else if (r.type === 'CHILD') {
        parentId = r.toPersonId
        childId = r.fromPersonId
      }

      if (parentId && childId) {
        const arr = parentToChildren.get(parentId) ?? []
        arr.push(childId)
        parentToChildren.set(parentId, arr)
      }
    })

    for (let i = 0; i < filtered.length * 2; i++) {
      let changed = false
      parentToChildren.forEach((children, parent) => {
        const parentLevel = levels.get(parent) ?? 0
        children.forEach((child) => {
          const childLevel = levels.get(child) ?? 0
          const next = Math.max(childLevel, parentLevel + 1)
          if (next !== childLevel) {
            levels.set(child, next)
            changed = true
          }
        })
      })
      if (!changed) break
    }

    const spouseLinks = relationships.filter(
      (r) => r.type === 'SPOUSE' && visibleIds.has(r.fromPersonId) && visibleIds.has(r.toPersonId),
    )
    spouseLinks.forEach((r) => {
      const a = levels.get(r.fromPersonId) ?? 0
      const b = levels.get(r.toPersonId) ?? 0
      const same = Math.min(a, b)
      levels.set(r.fromPersonId, same)
      levels.set(r.toPersonId, same)
    })

    const byLevel = new Map<number, Person[]>()
    filtered.forEach((p) => {
      const lv = levels.get(p.id) ?? 0
      const arr = byLevel.get(lv) ?? []
      arr.push(p)
      byLevel.set(lv, arr)
    })

    const positions = new Map<string, { x: number; y: number }>()
    const levelKeys = [...byLevel.keys()].sort((a, b) => a - b)
    levelKeys.forEach((lv) => {
      const row = (byLevel.get(lv) ?? []).sort((a, b) => `${a.firstName} ${a.lastName ?? ''}`.localeCompare(`${b.firstName} ${b.lastName ?? ''}`))
      row.forEach((p, i) => {
        positions.set(p.id, { x: i * 260, y: lv * 180 })
      })
    })

    return positions
  }, [filtered, relationships])

  const nodes: Node[] = filtered.map((p) => {
    const highlighted =
      selectedId === p.id ||
      relationships.some((r) =>
        selectedId ? (r.fromPersonId === selectedId || r.toPersonId === selectedId) && (r.fromPersonId === p.id || r.toPersonId === p.id) : false,
      )

    const fallback = autoPositions.get(p.id) ?? { x: 0, y: 0 }

    return {
      id: p.id,
      data: {
        label: `${p.firstName} ${p.lastName ?? ''}`.trim(),
      },
      position: {
        x: p.posX ?? fallback.x,
        y: p.posY ?? fallback.y,
      },
      draggable: true,
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
      let source = r.fromPersonId
      let target = r.toPersonId
      if (r.type === 'CHILD') {
        source = r.toPersonId
        target = r.fromPersonId
      }
      return {
        id: r.id,
        source,
        target,
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
      gender: form.gender,
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

  const onNodeDragStop: NodeDragHandler = async (_e, node) => {
    const person = people.find((p) => p.id === node.id)
    if (!person) return

    const next = { ...person, posX: node.position.x, posY: node.position.y }
    setPeople((prev) => prev.map((p) => (p.id === node.id ? next : p)))

    await api.updatePerson(person.id, {
      firstName: person.firstName,
      lastName: person.lastName ?? null,
      birthDate: dateOrNull(person.birthDate),
      deathDate: dateOrNull(person.deathDate),
      gender: person.gender,
      nationality: person.nationality,
      notes: person.notes ?? null,
      posX: node.position.x,
      posY: node.position.y,
    })
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
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
            <option value="UNKNOWN">Gender: Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}>
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
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
          <select value={relType} onChange={(e) => setRelType(e.target.value as 'PARENT' | 'SPOUSE' | 'SIBLING' | 'CHILD')}>
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
          onNodeDragStop={onNodeDragStop}
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
