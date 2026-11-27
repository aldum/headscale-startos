import { sdk } from '../sdk'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { dependencies } from '../dependencies'
import { seedStore } from './seedStore'
import { setupCerts } from './setupCerts'
import { watchSetup } from './watchSetup'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  setupCerts,
  dependencies,
  actions,
  seedStore,
  watchSetup,
)

export const uninit = sdk.setupUninit(versionGraph)
