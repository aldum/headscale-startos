import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  controlExternalPort,
  controlHostId,
  controlInterfaceId,
  controlPort,
  stunHostId,
  stunInterfaceId,
  stunPort,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const controlHost = sdk.MultiHost.of(effects, controlHostId)
  const controlOrigin = await controlHost.bindPort(controlPort, {
    protocol: null,
    preferredExternalPort: controlExternalPort,
    addSsl: null,
    secure: { ssl: true },
  })
  const control = sdk.createInterface(effects, {
    name: i18n('Coordination API'),
    id: controlInterfaceId,
    description: i18n('Where Tailscale devices connect to join your tailnet'),
    type: 'api',
    masked: false,
    schemeOverride: { ssl: 'https', noSsl: null },
    username: null,
    path: '',
    query: {},
  })

  const stunHost = sdk.MultiHost.of(effects, stunHostId)
  const stunOrigin = await stunHost.bindPort(stunPort, {
    protocol: null,
    preferredExternalPort: stunPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const stun = sdk.createInterface(effects, {
    name: i18n('DERP Relay'),
    id: stunInterfaceId,
    description: i18n(
      'Relays tailnet traffic when devices cannot connect directly',
    ),
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })

  return [
    await controlOrigin.export([control]),
    await stunOrigin.export([stun]),
  ]
})
