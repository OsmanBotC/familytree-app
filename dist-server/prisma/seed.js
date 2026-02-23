import { PrismaClient, RelationshipType } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.relationship.deleteMany();
    await prisma.residency.deleteMany();
    await prisma.person.deleteMany();
    const john = await prisma.person.create({
        data: { firstName: 'John', lastName: 'Silva', nationality: 'Brazilian', birthDate: new Date('1960-05-01') },
    });
    const maria = await prisma.person.create({
        data: { firstName: 'Maria', lastName: 'Silva', nationality: 'Portuguese', birthDate: new Date('1962-07-11') },
    });
    const ana = await prisma.person.create({
        data: { firstName: 'Ana', lastName: 'Silva', nationality: 'Spanish', birthDate: new Date('1990-03-20') },
    });
    await prisma.residency.createMany({
        data: [
            { personId: john.id, country: 'Brazil', fromDate: new Date('1960-05-01'), toDate: new Date('1995-01-01') },
            { personId: john.id, country: 'Spain', fromDate: new Date('1995-01-01'), isCurrent: true },
            { personId: ana.id, country: 'Spain', fromDate: new Date('1990-03-20'), isCurrent: true },
        ],
    });
    await prisma.relationship.createMany({
        data: [
            { fromPersonId: john.id, toPersonId: maria.id, type: RelationshipType.SPOUSE },
            { fromPersonId: john.id, toPersonId: ana.id, type: RelationshipType.PARENT },
            { fromPersonId: maria.id, toPersonId: ana.id, type: RelationshipType.PARENT },
        ],
    });
}
main().finally(async () => prisma.$disconnect());
