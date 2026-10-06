import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  endpointUrl: z.string().nullable().catch(null),
  baseDomain: z.string().nullable().catch(null),
})

export type Store = z.infer<typeof shape>

export const store = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)

export function emptyStore(): Store {
  return {
    endpointUrl: null,
    baseDomain: null,
  }
}
