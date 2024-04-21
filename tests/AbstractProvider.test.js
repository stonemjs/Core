import { AbstractProvider } from '../src/AbstractProvider.mjs'

describe('AbstractProvider', () => {
  describe('#register, #boot', () => {
    it('must throw an error', () => {
      // Arrange
      const provider = new AbstractProvider({ name: 'Stone' })

      expect(provider.container).toEqual({ name: 'Stone' })

      try {
        // Act
        const res = provider.register()
        expect(res).toBe(provider.container) // To be sure error has been thrown
      } catch (error) {
        // Assert
        expect(error.message).toBe('Cannot call this abstract method.')
      }

      try {
        // Act
        const res = provider.boot()
        expect(res).toBe(provider.container) // To be sure error has been thrown
      } catch (error) {
        // Assert
        expect(error.message).toBe('Cannot call this abstract method.')
      }
    })
  })
})
