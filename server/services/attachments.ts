import { attachmentRepository } from '../repositories/attachmentRepository'
import { saveImage } from '../utils/storage'

export async function createAttachment(cardId: number, file: { fileName: string, mimeType: string, data: Buffer }) {
  const storageKey = await saveImage(file.mimeType, file.data)

  return attachmentRepository.create({
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.data.length,
    storageKey,
    card: { connect: { id: cardId } }
  })
}

export function getAttachment(id: number) {
  return attachmentRepository.findById(id)
}
