import { CreateNodeArgs, SourceNodesArgs } from 'gatsby'
import { createRemoteFileNode } from 'gatsby-source-filesystem'
import { getImages, getStorage } from './gcp'
import {
  createGcsImageNode,
  GcsImageOptions,
  GCS_IMAGE_NODE_TYPE,
  getFileParts,
  getImageNodesById,
  isCacheValid,
  parseGcsImageOptions,
} from './utils'

async function onCreateNode({ actions, getNode, node }: CreateNodeArgs): Promise<void> {
  if (node.internal.type !== GCS_IMAGE_NODE_TYPE || !node.parent) {
    return
  }

  const parentFileNode = getNode(node.parent)
  if (!parentFileNode) {
    throw new Error(`Parent File node not found for GcsImage ${node.id}`)
  }

  let imageSharpNode = getNode(parentFileNode.children.find(id => id !== node.id) ?? '')
  let attempt = 0
  while (!imageSharpNode && attempt < 10) {
    attempt++
    await new Promise((res) => setTimeout(() => res(null), 250))
    imageSharpNode = getNode(parentFileNode?.children?.find(id => id !== node.id) ?? '')
  }

  if (!imageSharpNode) {
    throw new Error(`ImageSharp node not found to link to GcsImage ${node.id}`)
  }

  actions.createParentChildLink({ child: imageSharpNode, parent: node })
}

async function sourceNodes(args: SourceNodesArgs, gcsImageOptions: GcsImageOptions): Promise<void> {
  const { actions, cache, createNodeId, getNodes } = args
  const { createNode } = actions
  const {
    bucketName,
    bucketPath,
    credentials,
    expiresAt,
    projectId,
  } = parseGcsImageOptions(gcsImageOptions)

  const storage = getStorage(projectId, credentials)
  const images = await getImages({ bucketName, path: bucketPath, storage })
  const imageNodesById = getImageNodesById(getNodes())

  await Promise.all(images.map(async image => {
    const cachedImage = imageNodesById[image.metadata.id]
    const { name, ext } = getFileParts(image.metadata.name)
    const isImageCached = isCacheValid(cachedImage, image.metadata.updated)

    let url: string | undefined = !!cachedImage?.internal.content && isImageCached
      ? cachedImage.internal.content
      : undefined
    if (!url) {
      const [signedUrl] = await image.getSignedUrl({ action: 'read', expires: expiresAt })
      url = signedUrl
    }

    const fileNode = await createRemoteFileNode({
      cache,
      createNode,
      createNodeId,
      ext,
      name,
      url,
    })

    const gcsImageNode = createGcsImageNode({
      createNodeId,
      expiresAt,
      fileNode,
      image,
      name,
      url,
    })

    createNode(gcsImageNode)
  }))
}

export {
  onCreateNode,
  sourceNodes,
}
