import { CreateNodeArgs, SourceNodesArgs } from 'gatsby'
import { createRemoteFileNode } from 'gatsby-source-filesystem'
import { getImages, getStorage } from './gcp'
import {
  createGcsImageNode,
  GcsImageOptions,
  GCS_IMAGE_NODE_TYPE,
  getFileParts,
  parseGcsImageOptions,
} from './utils'

function onCreateNode({ actions, getNode, node }: CreateNodeArgs): void {
  if (node.internal.type !== GCS_IMAGE_NODE_TYPE || !node.parent) {
    return
  }

  const parentNode = getNode(node.parent)
  const imageSharpNode = getNode(parentNode?.children?.find(id => id !== node.id) ?? '')
  if (!imageSharpNode) {
    return
  }

  actions.createParentChildLink({ child: imageSharpNode, parent: node })
}

async function sourceNodes(args: SourceNodesArgs, gcsImageOptions: GcsImageOptions): Promise<void> {
  const { actions, cache, createNodeId } = args
  const { createNode } = actions
  const {
    bucketName,
    bucketPath,
    credentials,
    expires,
    projectId,
  } = parseGcsImageOptions(gcsImageOptions)

  const storage = getStorage(projectId, credentials)
  const images = await getImages({ bucketName, path: bucketPath, storage })

  await Promise.all(images.map(async image => {
    const [url] = await image.getSignedUrl({ action: 'read', expires })
    const { name, ext } = getFileParts(image.metadata.name)

    const fileNode = await createRemoteFileNode({
      cache,
      createNode,
      createNodeId,
      ext,
      name,
      url,
    })

    const gcsImageNode = createGcsImageNode({ createNodeId, fileNode, image, name, url })

    createNode(gcsImageNode)
  }))
}

export {
  onCreateNode,
  sourceNodes,
}
