import * as chai from 'chai'
import * as sinon from 'sinon'

export const mochaHooks = {
  beforeAll () {
    this.sinon = sinon
    this.assert = sinon.assert.expose(chai.assert, { prefix: '' })
  },
  afterEach () {
    this.sinon.restore()
  }
}
