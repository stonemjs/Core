#!/usr/bin/env node
import { App } from '../dist/cli.js'
import { getStoneOptions } from '@stone-js/common'

/**
 * Get stone config options.
 */
const stoneOptions = await getStoneOptions()

/**
 * Execute CLI application.
 */
await App.createAndRun(stoneOptions)