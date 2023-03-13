import { File } from '@google-cloud/storage'
import { Node as GatsbyNode, NodeInput as GatsbyNodeInput } from 'gatsby'
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
  expiresAt: number
  projectId: string
}
export function parseGcsImageOptions(options: GcsImageOptions): GcsImageArgs {
  const {
    bucketName: bucketNameOpt,
    bucketPath,
    credsJson,
    expires = 900, // 15 minutes
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
  const expiresAt = Date.now() + expires * 1000
  if (!projectId || !bucketName) {
    throw new Error('Must provide projectId and bucketName for gcs images')
  }

  return {
    bucketName,
    bucketPath,
    credentials: creds.gcp,
    expiresAt,
    projectId,
  }
}

export function isImage(fileName: string): boolean {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName)
}

export function isCacheValid(node: GcsImageNode | undefined, lastUpdated: string): boolean {
  return !!node
    && node.expiresAt > Date.now() + 10 * 60 * 1000 // greater than 10 minutes from now
    && node.updatedAt >= lastUpdated // file has not been updated in gcs
}

type GcsImageNodesById = { [id: string]: GcsImageNode }
export function getImageNodesById(nodes: GatsbyNode[]): GcsImageNodesById {
  return nodes.reduce<GcsImageNodesById>((images, node) => {
    const image = node as unknown as GcsImageNode
    if (image.internal.type === GCS_IMAGE_NODE_TYPE && !!image.gcsId) {
      images[image.gcsId] = image
    }

    return images
  }, {})
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
  expiresAt: number
  fileNode: Pick<FileSystemNode, 'absolutePath' | 'id'>
  image: Pick<File, 'metadata'>
  name: string
  url: string
}
export type GcsImageNode = GatsbyNodeInput & {
  absolutePath: string
  expiresAt: number
  gcsId: string
  name: string
  updatedAt: string
}
export function createGcsImageNode(params: CreateGcsImageNodeParams): GcsImageNode {
  const { createNodeId, expiresAt, fileNode, image, name, url } = params

  return {
    absolutePath: fileNode.absolutePath,
    expiresAt,
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
    updatedAt: image.metadata.updated ?? new Date().toISOString(),
  }
}
