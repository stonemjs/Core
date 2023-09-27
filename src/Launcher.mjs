export class Launcher {
  launch (Application, configurations = {}) {
    return Application.default(configurations).run()
  }
}
