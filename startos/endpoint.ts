import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { controlHostId, controlInterfaceId } from './utils'

/**
 * Re-reading the control interface's addresses is the reactive half of
 * resolving the server URL; `bestServerUrl` in utils.ts is the pure half.
 */
export function controlUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, controlHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((binding) => Object.values(binding.interfaces))
          .find((candidate) => candidate.id === controlInterfaceId)
      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .const()
}

export function controlUrlsOnce(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, controlHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((binding) => Object.values(binding.interfaces))
          .find((candidate) => candidate.id === controlInterfaceId)
      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .once()
}
