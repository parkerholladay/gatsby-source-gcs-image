import { File } from '@google-cloud/storage'
import { NodeInput as GatsbyNodeInput } from 'gatsby'
import { FileSystemNode } from 'gatsby-source-filesystem'
import path from 'path'
import { GcpCredentials, parseCredentials } from './creds'

export const GCS_IMAGE_NODE_TYPE = 'GcsImage'
const IMAGE_EXTENSIONS = /.(gif|jpe?g|png|tiff)$/

export interface GcsImageOptions {
  bucketName?: string
  bucketPath?: string
  credsJson?: string
  expires?: number
  pathToCreds?: string
  projectId?: string
}
export type GcsImageArgs = {
  bucketName: string
  bucketPath?: string
  credentials: GcpCredentials
  expires: number
  projectId: string
}
export function parseGcsImageOptions(options: GcsImageOptions): GcsImageArgs {
  const {
    bucketName: bucketNameOpt,
    bucketPath,
    credsJson,
    expires: expiresOpt = 900, // 15 minutes
    pathToCreds,
    projectId: projectIdOpt,
  } = options

  if (!credsJson && !pathToCreds) {
    throw new Error('Must provide either credsJson or pathToCreds for gcs images')
  }

  const creds = parseCredentials(credsJson, pathToCreds)
  if (!creds) {
    throw new Error('Unable to get creds for gcs images')
  }

  const projectId = projectIdOpt ?? creds.projectId
  const bucketName = bucketNameOpt ?? creds.bucketName
  const expires = Date.now() + expiresOpt * 1000
  if (!projectId || !bucketName) {
    throw new Error('Must provide projectId and bucketName for gcs images')
  }

  return {
    bucketName,
    bucketPath,
    credentials: creds.gcp,
    expires,
    projectId,
  }
}

export function isImage(fileName: string): boolean {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName)
}

type FileParts = {
  ext: string
  name: string
}
export function getFileParts(fileName: string): FileParts {
  const { ext, name } = path.parse(fileName)
  return { ext, name }
}

type CreateGcsImageNodeParams = {
  createNodeId: (hash: string) => string
  fileNode: Pick<FileSystemNode, 'absolutePath' | 'id'>
  image: Pick<File, 'metadata'>
  name: string
  url: string
}
export type GcsImageNode = GatsbyNodeInput & {
  absolutePath: string
  gcsId: string
  name: string
}
export function createGcsImageNode(params: CreateGcsImageNodeParams): GcsImageNode {
  const { createNodeId, fileNode, image, name, url } = params

  return {
    absolutePath: fileNode.absolutePath,
    gcsId: image.metadata.id,
    id: createNodeId(image.metadata.etag),
    internal: {
      content: url,
      contentDigest: image.metadata.etag,
      mediaType: image.metadata.contentType,
      type: GCS_IMAGE_NODE_TYPE,
    },
    name,
    parent: fileNode.id,
  }
}
