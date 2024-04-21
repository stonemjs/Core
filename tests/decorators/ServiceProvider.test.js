import { AbstractProvider } from '../../src/AbstractProvider.mjs'
import { ServiceProvider } from '../../src/decorators/ServiceProvider.mjs'

describe('#ServiceProviderDecorator', () => {
  it('Must throw an exception when target is not a class', () => {
    // Arrange
    class UserProvider {}
    try {
      // Act
      ServiceProvider({})(UserProvider.prototype)
    } catch (error) {
      // Assert
      expect(error.message).toBe('This decorator can only be applied at class level.')
    }
  })
  it('should add $$metadata$$ static property to class', () => {
    // Arrange
    class UserProvider {}

    // Act
    const response = ServiceProvider()(UserProvider)

    // Assert
    expect(response.$$metadata$$).toBeTruthy()
    expect(response.$$metadata$$.serviceProvider).toBeTruthy()
  })

  it('must extend Provider class', () => {
    // Arrange
    class UserProvider {}

    // Act
    const NewUserProvider = ServiceProvider()(UserProvider)
    const userProvider = new NewUserProvider()

    // Assert
    expect(Object.getPrototypeOf(NewUserProvider)).toEqual(AbstractProvider)
    expect(Object.getPrototypeOf(NewUserProvider.prototype)).toEqual(AbstractProvider.prototype)

    try {
      const res = userProvider.register()
      expect(res).toBe(true) // To be sure error has been thrown
    } catch (error) {
      expect(error.message).toBe('Cannot call this abstract method.')
    }

    try {
      const res = userProvider.boot()
      expect(res).toBe(true) // To be sure error has been thrown
    } catch (error) {
      expect(error.message).toBe('Cannot call this abstract method.')
    }
  })
})
