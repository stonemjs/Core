export class Launcher {
  launch (Application, context = {}) {
    return Application.default(context).run()
  }
}
