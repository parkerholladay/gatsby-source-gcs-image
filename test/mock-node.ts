import { randomUUID } from 'crypto'
import { Node as GatsbyNode } from 'gatsby'
import { DeepPartial } from './utils'

export function generateNode(overrides?: DeepPartial<GatsbyNode>): GatsbyNode {
  return {
    children: [],
    id: randomUUID(),
    parent: randomUUID(),
    ...overrides,
    internal: {
      contentDigest: randomUUID(),
      owner: 'foo-bar',
      type: 'File',
      ...overrides?.internal,
    },
  }
}
