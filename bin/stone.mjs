#!/usr/bin/env node
import { App, importModuleFromCWD } from '../dist/cli.mjs'

const options = await importModuleFromCWD('./stone.config.mjs') ?? await importModuleFromCWD('./stone.config.js')

if (!options) {
  throw new TypeError('You must defined a `stone.config.mjs` file at the root of your application.')
}

/**
 * Execute CLI application.
 */
await App.createAndRun(Object.values(options).shift())