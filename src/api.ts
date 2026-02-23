export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'

export type Person = {
  id: string
  firstName: string
  lastName?: string | null
  birthDate?: string | null
  deathDate?: string | null
  gender: Gender
  nationality: string
  notes?: string | null
  posX?: number | null
  posY?: number | null
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
  people: (): Promise<Person[]> => fetch('/api/people').then((r) => r.json()),
  relationships: (): Promise<Relationship[]> => fetch('/api/relationships').then((r) => r.json()),
  createPerson: (payload: Partial<Person>) =>
    fetch('/api/people', { method: 'POST', headers, body: JSON.stringify(payload) }).then((r) => r.json()),
  updatePerson: (id: string, payload: Partial<Person>) =>
    fetch(`/api/people/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) }).then((r) => r.json()),
  deletePerson: (id: string) =>
    fetch(`/api/people/${id}`, { method: 'DELETE' }),
  createRelationship: (payload: Omit<Relationship, 'id'>) =>
    fetch('/api/relationships', { method: 'POST', headers, body: JSON.stringify(payload) }).then((r) => r.json()),
}
