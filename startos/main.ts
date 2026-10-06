import { FileHelper } from '@start9labs/start-sdk'
import { store } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { primaryUrl } from './actions/configure'
import {
  configPath,
  controlHostId,
  controlPort,
  renderDerpMap,
  renderHeadscaleConfig,
  stunHostId,
  stunPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  const serverUrl = await primaryUrl.bestUsable(effects).const()
  if (!serverUrl) {
    throw new Error(i18n('Run Set Primary URL before starting the service.'))
  }
  const current = await store.read().const(effects)
  const config = {
    endpointUrl: serverUrl,
    baseDomain: current?.baseDomain ?? null,
  }
  // headscale reads the TLS pair once at startup, so a reissued certificate
  // (a changed address set) has to restart the daemon to take effect.
  await FileHelper.string({
    base: sdk.volumes.main,
    subpath: 'tls.crt',
  })
    .read()
    .const(effects)
  await FileHelper.string({
    base: sdk.volumes.main,
    subpath: 'tls.key',
  })
    .read()
    .const(effects)
  // The DERP map advertises the live external ports: the embedded server
  // listens on the containers' fixed ports, but StartOS may assign different
  // external ones (another package holding a preferred port, e.g. coturn on
  // UDP 3478). Re-rendering on every port change keeps STUN and DERP dialable.
  const hostname = new URL(config.endpointUrl).hostname
  const derpPort = await sdk.host
    .getOwn(
      effects,
      controlHostId,
      (host) => host?.bindings[controlPort]?.net.assignedSslPort ?? null,
    )
    .const()
  const stunPortExternal = await sdk.host
    .getOwn(
      effects,
      stunHostId,
      (host) => host?.bindings[stunPort]?.net.assignedPort ?? null,
    )
    .const()
  if (derpPort === null || stunPortExternal === null) {
    throw new Error(i18n('Headscale network bindings are not ready'))
  }
  await sdk.volumes.main.writeFile(
    '/derp.yaml',
    renderDerpMap({ hostname, derpPort, stunPort: stunPortExternal }),
    { mode: 0o600 },
  )
  await sdk.volumes.main.writeFile(
    '/config.yaml',
    renderHeadscaleConfig(config),
    { mode: 0o600 },
  )

  const headscale = sdk.SubContainer.of(
    effects,
    { imageId: 'headscale' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'headscale',
  )

  return sdk.Daemons.of(effects).addDaemon('headscale', {
    subcontainer: headscale,
    exec: {
      command: sdk.useEntrypoint(['-c', configPath, 'serve']),
    },
    ready: {
      display: i18n('Coordination API'),
      fn: () =>
        sdk.healthCheck.runHealthScript(
          ['/ko-app/headscale', '-c', configPath, 'health'],
          headscale,
          {
            message: () => i18n('The coordination API is ready'),
            errorMessage: i18n('Headscale is not ready'),
          },
        ),
    },
    requires: [],
  })
})
