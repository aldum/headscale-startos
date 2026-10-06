import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { headscaleCli } from './helpers'
import { deviceInputSpec } from './deviceInput'

export const removeDevice = sdk.Action.withInput(
  'remove-device',
  async () => ({
    name: i18n('Remove Device'),
    description: i18n(
      'Delete a device from the tailnet. To reconnect it, you will need a new key.',
    ),
    warning: i18n(
      'The device is removed from the database. Its connection will stop immediately and a new key will be required to rejoin.',
    ),
    allowedStatuses: 'only-running',
    group: i18n('Devices'),
    visibility: 'enabled',
  }),
  deviceInputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    if (!input.id) throw new Error(i18n('Select a device first.'))
    await headscaleCli(effects, [
      'nodes',
      'delete',
      '--identifier',
      input.id,
      '--force',
    ])
    return {
      version: '1',
      title: i18n('Device Removed'),
      message: i18n('The device was removed from the tailnet.'),
      result: null,
    }
  },
)
