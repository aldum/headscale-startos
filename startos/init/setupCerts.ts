import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { controlHostId, controlPort } from '../utils'

export const setupCerts = sdk.setupOnInit(async (effects) => {
  const served = await sdk.host
    .getOwn(effects, controlHostId, (host) =>
      host
        ? utils
            .filledAddress(host, {
              hostId: controlHostId,
              internalPort: controlPort,
              username: null,
              scheme: null,
              sslScheme: null,
              suffix: '',
            })
            // everything except the WAN IPv4, which the box does not hold
            .matchesAny([
              { visibility: 'private' },
              { exclude: { kind: 'ipv4' } },
            ])
            // nothing dials loopback or link-local; 127.0.0.1 is added below
            .filter({ exclude: { kind: ['localhost', 'link-local'] } })
            .hostnames.map((h) => h.hostname)
        : [],
    )
    .const()

  const hostnames = [
    await sdk.getContainerIp(effects).const(),
    '127.0.0.1',
    await sdk.getOsIp(effects),
    ...served,
  ]
  const cert = (await sdk.getSslCertificate(effects, hostnames).const()).join(
    '',
  )
  const key = await sdk.getSslKey(effects, { hostnames })
  await sdk.volumes.main.writeFile('/tls.crt', cert)
  await sdk.volumes.main.writeFile('/tls.key', key, { mode: 0o600 })
})
