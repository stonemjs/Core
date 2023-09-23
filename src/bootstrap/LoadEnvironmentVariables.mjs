export class LoadEnvironmentVariables {
  async bootstrap({ app }) {
    const result = (await import('dotenv')).config({ debug: app.isDebug })
    if (result.error) throw result.error
    return result.parsed
  }
}