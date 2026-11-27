import { configure } from '../actions/configure'
import { setupDns } from '../actions/setupDns'
import { controlUrls } from '../endpoint'
import { bestServerUrl } from '../utils'
import { store } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchSetup = sdk.setupOnInit(async (effects) => {
  const current = await store.read().const(effects)
  const serverUrl = bestServerUrl(
    current?.endpointUrl,
    await controlUrls(effects),
  )

  await sdk.action.clearTask(
    effects,
    'headscale:configure',
    'headscale:setup-dns',
  )

  // primaryUrl.setupTask is not used: its `input-not-matches` condition is
  // re-evaluated when the interface's addresses change, not when the stored
  // URL does, so a task answered by anything but the task surface stays raised
  // and the service never starts. This watcher is const() on the store, so it
  // re-runs on the write and clears the task itself.
  if (!serverUrl) {
    await sdk.action.createOwnTask(effects, configure, 'critical', {
      reason: i18n(
        'Choose the address your devices will connect to before starting.',
      ),
    })
    return
  }

  if (!current?.baseDomain) {
    await sdk.action.createOwnTask(effects, setupDns, 'important', {
      reason: i18n(
        'Set a domain so your devices can find each other by name (MagicDNS).',
      ),
    })
  }
})
