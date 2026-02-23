export type Person = {
  id: string
  firstName: string
  lastName?: string | null
  birthDate?: string | null
  deathDate?: string | null
  nationality: string
  notes?: string | null
}

export type Relationship = {
  id: string
  fromPersonId: string
  toPersonId: string
  type: 'PARENT' | 'SPOUSE' | 'SIBLING' | 'CHILD'
  notes?: string | null
}

const headers = { 'Content-Type': 'application/json' }

export const api = {
  people: () => fetch('/api/people').then((r) => r.json()),
  relationships: () => fetch('/api/relationships').then((r) => r.json()),
  createPerson: (payload: Partial<Person>) =>
    fetch('/api/people', { method: 'POST', headers, body: JSON.stringify(payload) }).then((r) => r.json()),
  createRelationship: (payload: Omit<Relationship, 'id'>) =>
    fetch('/api/relationships', { method: 'POST', headers, body: JSON.stringify(payload) }).then((r) => r.json()),
}
