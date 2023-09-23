export class RequestHandled {
  #request
  #response

  constructor (request, response) {
    this.#request = request
    this.#response = response
  }

  get request () {
    return this.#request
  }

  get response () {
    return this.#response
  }
}
