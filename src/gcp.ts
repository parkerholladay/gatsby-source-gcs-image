import { File, Storage } from '@google-cloud/storage'
import { GcpCredentials } from './creds'
import { isImage } from './utils'

export function getStorage(projectId: string, credentials: GcpCredentials): Storage {
  return new Storage({ credentials, projectId })
}

type GetImagesParams = {
  bucketName: string
  path?: string
  storage: Storage
}
export async function getImages({ bucketName, path, storage }: GetImagesParams): Promise<File[]> {
  const bucket = storage.bucket(bucketName)
  const [files] = await bucket.getFiles({ autoPaginate: false, prefix: path })

  return files.filter(f => isImage(f.name))
}
