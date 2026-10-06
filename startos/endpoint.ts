import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { controlHostId, controlInterfaceId } from './utils'

export function enabledControlUrls(effects: T.Effects): Promise<string[]> {
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
