import { setupDns } from '../actions/setupDns'
import { store } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchSetup = sdk.setupOnInit(async (effects) => {
  const current = await store.read().const(effects)

  await sdk.action.clearTask(effects, 'headscale:setup-dns')

  // The primary-URL task is owned by primaryUrl.setupTask now; this watcher
  // only keeps the MagicDNS prompt.
  if (!current?.baseDomain) {
    await sdk.action.createOwnTask(effects, setupDns, 'important', {
      reason: i18n(
        'Set a domain so your devices can find each other by name (MagicDNS).',
      ),
    })
  }
})
