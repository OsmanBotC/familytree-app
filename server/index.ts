import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from './db.js'
import { z } from 'zod'

const app = express()
app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const personSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  nationality: z.string().min(1),
  notes: z.string().optional().nullable(),
  posX: z.number().optional().nullable(),
  posY: z.number().optional().nullable(),
})

const residencySchema = z.object({
  personId: z.string().min(1),
  country: z.string().min(1),
  fromDate: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
})

const relationshipSchema = z.object({
  fromPersonId: z.string().min(1),
  toPersonId: z.string().min(1),
  type: z.enum(['PARENT', 'SPOUSE', 'SIBLING', 'CHILD']),
  notes: z.string().optional().nullable(),
})

const parseDate = (value?: string | null) => (value ? new Date(value) : null)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/people', async (req, res) => {
  const q = (req.query.q as string | undefined)?.toLowerCase()
  const nationality = req.query.nationality as string | undefined

  const people = await prisma.person.findMany({
    where: {
      ...(nationality ? { nationality: { equals: nationality } } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
            ],
          }
        : {}),
    },
    include: { residencies: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json(people)
})

app.get('/api/people/:id', async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: req.params.id },
    include: {
      residencies: true,
      fromRels: true,
      toRels: true,
    },
  })
  if (!person) return res.status(404).json({ error: 'Person not found' })
  res.json(person)
})

app.post('/api/people', async (req, res) => {
  const parsed = personSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const p = parsed.data

  const person = await prisma.person.create({
    data: {
      firstName: p.firstName,
      lastName: p.lastName || null,
      birthDate: parseDate(p.birthDate),
      deathDate: parseDate(p.deathDate),
      gender: p.gender ?? 'UNKNOWN',
      nationality: p.nationality,
      notes: p.notes || null,
      posX: p.posX ?? null,
      posY: p.posY ?? null,
    },
  })
  res.status(201).json(person)
})

app.put('/api/people/:id', async (req, res) => {
  const parsed = personSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const p = parsed.data

  const person = await prisma.person.update({
    where: { id: req.params.id },
    data: {
      firstName: p.firstName,
      lastName: p.lastName || null,
      birthDate: parseDate(p.birthDate),
      deathDate: parseDate(p.deathDate),
      gender: p.gender ?? 'UNKNOWN',
      nationality: p.nationality,
      notes: p.notes || null,
      posX: p.posX ?? null,
      posY: p.posY ?? null,
    },
  })

  res.json(person)
})

app.delete('/api/people/:id', async (req, res) => {
  await prisma.person.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

app.get('/api/residencies', async (_req, res) => {
  res.json(await prisma.residency.findMany())
})

app.post('/api/residencies', async (req, res) => {
  const parsed = residencySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const r = parsed.data

  const residency = await prisma.residency.create({
    data: {
      personId: r.personId,
      country: r.country,
      fromDate: parseDate(r.fromDate),
      toDate: parseDate(r.toDate),
      isCurrent: r.isCurrent ?? false,
    },
  })

  res.status(201).json(residency)
})

app.delete('/api/residencies/:id', async (req, res) => {
  await prisma.residency.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

app.get('/api/relationships', async (_req, res) => {
  res.json(await prisma.relationship.findMany())
})

app.post('/api/relationships', async (req, res) => {
  const parsed = relationshipSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())

  const relationship = await prisma.relationship.create({ data: parsed.data })
  res.status(201).json(relationship)
})

app.delete('/api/relationships/:id', async (req, res) => {
  await prisma.relationship.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

const clientDist = path.resolve(__dirname, '../../dist')
app.use(express.static(clientDist))
app.use((_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => console.log(`Server running on :${port}`))
