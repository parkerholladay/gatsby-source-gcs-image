import { Bucket, File, Storage } from '@google-cloud/storage'
import { expect } from 'chai'
import { sandbox } from '../../test/sandbox'
import * as subject from '../gcp'

describe('gcp', () => {
  describe('#getStorage', () => {
    const projectId = 'my-project'
    const credentials = {
      client_email: 'foo@bar.com',
      private_key: '---key-foo-bar---',
    }

    it('returns storage instance', () => {
      expect(subject.getStorage(projectId, credentials)).to.be.instanceOf(Storage)
    })
  })

  describe('#getImages', () => {
    const mockedStorage = sandbox.createStubInstance(Storage)
    const mockedBucket = sandbox.createStubInstance(Bucket)
    const mockedImage = sandbox.createStubInstance(File)
    const mockedFile = sandbox.createStubInstance(File)
    mockedImage.name = 'foo/bar.jpg'
    mockedFile.name = 'foo/bar.js'
    const bucketName = 'my-bucket'
    let files: File[]

    beforeEach(() => {
      files = [mockedImage, mockedFile]

      sandbox.stub(mockedStorage, 'bucket').callsFake(() => mockedBucket)
      sandbox.stub(mockedBucket, 'getFiles').callsFake(async () => [files])
    })

    it('gets files from storage bucket', async () => {
      const actual = await subject.getImages({ bucketName, storage: mockedStorage })

      expect(actual).to.eql([mockedImage])
      expect(mockedStorage.bucket).to.be.calledWith(bucketName)
      expect(mockedBucket.getFiles).to.be.calledWith({ autoPaginate: false, prefix: undefined })
    })
  })
})
