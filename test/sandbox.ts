import sinon from 'sinon'

const sandbox = sinon.createSandbox({ injectInto: null, properties: ['stub'] })

afterEach(() => {
  sandbox.restore()
})

export { sandbox }
