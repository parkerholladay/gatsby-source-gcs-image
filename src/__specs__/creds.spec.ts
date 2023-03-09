import { expect } from 'chai'
import * as subject from '../creds'

describe('creds', () => {
  describe('#parseCredentials', () => {
    const creds = {
      bucket_name: 'my-bucket',
      client_email: 'foo@bar.com',
      private_key: '---key-foo-bar---',
      project_id: 'my-project',
    }
    const expected = {
      bucketName: 'my-bucket',
      gcp: creds,
      projectId: 'my-project',
    }

    it('parses creds from json', () => {
      const actual = subject.parseCredentials(JSON.stringify(creds))

      expect(actual).to.eql(expected)
    })

    describe('when path is provided', () => {
      const actual = subject.parseCredentials(undefined, `${__dirname}/../../test/mock-creds.json`)

      expect(actual).to.eql(expected)
    })

    describe('when no json or path are provided', () => {
      it('returns null', () => {
        expect(subject.parseCredentials()).to.be.null
      })
    })
  })
})
