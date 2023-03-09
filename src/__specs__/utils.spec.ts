import { expect } from 'chai'
import { sandbox } from '../../test/sandbox'
import * as credentials from '../creds'
import * as subject from '../utils'

describe('utils', () => {
  describe('#parseGcsImageOptions', () => {
    let options: subject.GcsImageOptions
    let creds: credentials.Credentials | null

    beforeEach(() => {
      options = {
        bucketName: 'my-bucket',
        bucketPath: 'foo/bar',
        expires: 120,
        pathToCreds: './foo/bar',
        projectId: 'my-project',
      }

      creds = {
        bucketName: 'foo',
        gcp: {
          client_email: 'foo@bar.com',
          private_key: '---key-foo-bar---',
        },
        projectId: 'bar',
      }

      sandbox.stub(credentials, 'parseCredentials').callsFake(() => creds)
      sandbox.stub(Date, 'now').callsFake(() => 0)
    })

    it('gets args from plugin options', () => {
      const actual = subject.parseGcsImageOptions(options)
      const expected = {
        bucketName: 'my-bucket',
        bucketPath: 'foo/bar',
        expires: 120 * 1000,
        credentials: creds?.gcp,
        projectId: 'my-project',
      }

      expect(actual).to.eql(expected)
    })

    describe('when no bucketName or projectId are provided', () => {
      beforeEach(() => {
        options = {
          expires: 120,
          pathToCreds: './foo/bar',
        }
      })

      it('uses bucketName and projectId from creds', () => {
        const actual = subject.parseGcsImageOptions(options)
        const expected = {
          bucketName: creds?.bucketName,
          bucketPath: undefined,
          expires: 120 * 1000,
          credentials: creds?.gcp,
          projectId: creds?.projectId,
        }

        expect(actual).to.eql(expected)
      })
    })

    describe('when no expiration is provided', () => {
      beforeEach(() => {
        options = {
          pathToCreds: './foo/bar',
        }
      })

      it('defaults to 900 seconds', () => {
        const actual = subject.parseGcsImageOptions(options)
        const expected = {
          bucketName: creds?.bucketName,
          bucketPath: undefined,
          expires: 900 * 1000,
          credentials: creds?.gcp,
          projectId: creds?.projectId,
        }

        expect(actual).to.eql(expected)
      })
    })

    describe('when no creds are provided', () => {
      beforeEach(() => {
        options = {
          bucketName: 'my-bucket',
          projectId: 'my-project',
        }
      })

      it('throws error', () => {
        const expected = 'Must provide either credsJson or pathToCreds for gcs images'
        expect(() => subject.parseGcsImageOptions(options)).to.throw(Error, expected)
      })
    })

    describe('when no bucketName or projectId is provided', () => {
      beforeEach(() => {
        options = {
          pathToCreds: './foo/bar',
        }
        creds = {
          gcp: {
            client_email: 'foo@bar.com',
            private_key: '---key-foo-bar---',
          },
        }
      })

      it('throws error', () => {
        const expected = 'Must provide projectId and bucketName for gcs images'
        expect(() => subject.parseGcsImageOptions(options)).to.throw(Error, expected)
      })
    })

    describe('when creds are not found', () => {
      beforeEach(() => {
        creds = null
      })

      it('throws error', () => {
        const expected = 'Unable to get creds for gcs images'
        expect(() => subject.parseGcsImageOptions(options)).to.throw(Error, expected)
      })
    })
  })

  describe('#isImage', () => {
    it('returns true for gif', () => {
      expect(subject.isImage('foo/bar.gif')).to.be.true
    })

    it('returns true for jpg', () => {
      expect(subject.isImage('foo/bar.jpg')).to.be.true
      expect(subject.isImage('foo/bar.jpeg')).to.be.true
    })

    it('returns true for png', () => {
      expect(subject.isImage('foo/bar.png')).to.be.true
    })

    it('returns true for tiff', () => {
      expect(subject.isImage('foo/bar.tiff')).to.be.true
    })

    it('returns false for all others', () => {
      expect(subject.isImage('foo/bar.txt')).to.be.false
      expect(subject.isImage('foo/bar.doc')).to.be.false
      expect(subject.isImage('foo/bar.xls')).to.be.false
      expect(subject.isImage('foo/bar.ppt')).to.be.false
      expect(subject.isImage('foo/bar.pdf')).to.be.false
      expect(subject.isImage('foo/bar.html')).to.be.false
      expect(subject.isImage('foo/bar.css')).to.be.false
      expect(subject.isImage('foo/bar.js')).to.be.false
      expect(subject.isImage('foo/bar.ts')).to.be.false
      expect(subject.isImage('foo/bar.mp4')).to.be.false
      expect(subject.isImage('foo/bar.m4a')).to.be.false
      expect(subject.isImage('foo/bar.jpg.extra')).to.be.false
      expect(subject.isImage('foo/bar')).to.be.false
    })
  })

  describe('#getFileParts', () => {
    it('returns name and extension from path', () => {
      expect(subject.getFileParts('foo/bar.png')).to.eql({ ext: '.png', name: 'bar' })
    })

    it('returns name and extension when there is no path', () => {
      expect(subject.getFileParts('bar.png')).to.eql({ ext: '.png', name: 'bar' })
    })

    it('returns name when there is no extension', () => {
      expect(subject.getFileParts('foo/bar')).to.eql({ ext: '', name: 'bar' })
    })
  })

  describe('#createGcsImageNode', () => {
    const absolutePath = 'foo/bar.jpg'
    const contentType = 'image/jpeg'
    const gcsId = 'foo-bar'
    const etag = '---foobar---'
    const fileNode = { absolutePath: 'foo/bar.jpg', id: 'foo' }
    const image = {
      metadata: { contentType, etag, id: gcsId },
    }
    const name = 'bar'
    const url = 'https://foo/bar.jpg'
    const createNodeId = sandbox.stub().withArgs(etag).returns('***foobar***')

    it('returns gcs image node shape', () => {
      const actual = subject.createGcsImageNode({
        createNodeId,
        fileNode,
        image,
        name,
        url,
      })
      const expected = {
        absolutePath,
        gcsId,
        id: '***foobar***',
        internal: {
          content: url,
          contentDigest: etag,
          mediaType: contentType,
          type: subject.GCS_IMAGE_NODE_TYPE,
        },
        name,
        parent: fileNode.id,
      }

      expect(actual).to.eql(expected)
      expect(createNodeId).to.be.calledOnceWith(etag)
    })
  })
})
