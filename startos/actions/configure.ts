import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { store } from '../fileModels/store.json'
import { controlHostId, controlInterfaceId } from '../utils'

// The address headscale advertises (server_url, DERP region) and the one
// Add Device prints in its connect command. The id stays 'configure' so the
// first-run task's replay key survives from before this was SDK-managed.
export const primaryUrl = sdk.setupPrimaryUrl({
  id: 'configure',
  hostId: controlHostId,
  interfaceId: controlInterfaceId,
  metadata: {
    name: i18n('Set Primary URL'),
    description: i18n('Choose the address your devices connect to.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Settings'),
    visibility: 'enabled',
  },
  field: {
    name: i18n('Server address'),
    description: i18n(
      'The address your devices will connect to. The StartOS TLS certificate must be trusted on each device.',
    ),
  },
  get: store.read((s) => s.endpointUrl),
  set: (effects, url) => store.merge(effects, { endpointUrl: url }),
  // Headscale is useless without a chosen address: no silent fallback to a
  // preferred address, a critical task instead, and no start while null.
  fallback: false,
})

export const configure = primaryUrl.action

export const primaryUrlTask = primaryUrl.setupTask('critical', {
  reason: i18n(
    'Choose the address your devices will connect to before starting.',
  ),
})
