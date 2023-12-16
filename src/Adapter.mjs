export class Adapter {
  run (Application, configurations) {
    return Application.default(configurations).run()
  }
}
