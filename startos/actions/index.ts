import { sdk } from '../sdk'
import { addDevice } from './addDevice'
import { configure } from './configure'
import { expireDevice } from './expireDevice'
import { removeDevice } from './removeDevice'
import { setupDns } from './setupDns'
import { viewDevices } from './viewDevices'

export const actions = sdk.Actions.of()
  .addAction(configure)
  .addAction(setupDns)
  .addAction(addDevice)
  .addAction(viewDevices)
  .addAction(expireDevice)
  .addAction(removeDevice)
