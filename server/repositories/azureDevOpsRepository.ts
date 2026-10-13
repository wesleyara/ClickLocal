import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

const CONNECTION_ID = 1

export const azureDevOpsRepository = {
  findConnection() {
    return db.azureDevOpsConnection.findUnique({ where: { id: CONNECTION_ID } })
  },

  upsertConnection(data: Omit<Prisma.AzureDevOpsConnectionCreateInput, 'id'>) {
    return db.azureDevOpsConnection.upsert({
      where: { id: CONNECTION_ID },
      create: { id: CONNECTION_ID, ...data },
      update: data
    })
  },

  updateConnection(data: Prisma.AzureDevOpsConnectionUpdateInput) {
    return db.azureDevOpsConnection.update({ where: { id: CONNECTION_ID }, data })
  },

  findWorkItemByCardId(cardId: number) {
    return db.adoWorkItem.findUnique({ where: { cardId } })
  },

  findWorkItemsByAdoIds(adoIds: number[]) {
    return db.adoWorkItem.findMany({ where: { adoId: { in: adoIds } } })
  },

  findAllWorkItems() {
    return db.adoWorkItem.findMany()
  },

  createWorkItem(data: Prisma.AdoWorkItemCreateInput, client: DbClient = db) {
    return client.adoWorkItem.create({ data })
  },

  updateWorkItemByCardId(cardId: number, data: Prisma.AdoWorkItemUpdateInput, client: DbClient = db) {
    return client.adoWorkItem.update({ where: { cardId }, data })
  },

  findType(project: string, name: string) {
    return db.adoWorkItemType.findUnique({ where: { project_name: { project, name } } })
  },

  upsertType(project: string, name: string, data: Omit<Prisma.AdoWorkItemTypeCreateInput, 'project' | 'name'>) {
    return db.adoWorkItemType.upsert({
      where: { project_name: { project, name } },
      create: { project, name, ...data },
      update: data
    })
  }
}
