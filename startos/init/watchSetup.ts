import { configure } from '../actions/configure'
import { setupDns } from '../actions/setupDns'
import { enabledControlUrls } from '../endpoint'
import { store } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchSetup = sdk.setupOnInit(async (effects) => {
  const current = await store.read().const(effects)
  const urls = await enabledControlUrls(effects)

  await sdk.action.clearTask(
    effects,
    'headscale:configure',
    'headscale:setup-dns',
  )

  if (!current?.endpointUrl || !urls.includes(current.endpointUrl)) {
    await sdk.action.createOwnTask(effects, configure, 'critical', {
      reason: i18n(
        'Choose the address your devices will connect to before starting.',
      ),
    })
    return
  }

  if (!current.baseDomain) {
    await sdk.action.createOwnTask(effects, setupDns, 'important', {
      reason: i18n(
        'Set a domain so your devices can find each other by name (MagicDNS).',
      ),
    })
  }
})
