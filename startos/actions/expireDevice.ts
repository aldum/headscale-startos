import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { headscaleCli } from './helpers'
import { deviceInputSpec } from './deviceInput'

export const expireDevice = sdk.Action.withInput(
  'expire-device',
  async () => ({
    name: i18n('Expire Device'),
    description: i18n(
      'Log a device out. It keeps its place in the list but must authenticate again.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Devices'),
    visibility: 'enabled',
  }),
  deviceInputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    if (!input.id) throw new Error(i18n('Select a device first.'))
    await headscaleCli(effects, ['nodes', 'expire', '--identifier', input.id])
    return {
      version: '1',
      title: i18n('Device Expired'),
      message: i18n('The device was logged out and must reauthenticate.'),
      result: null,
    }
  },
)
