import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { listNodes, single } from './helpers'
import { T } from '@start9labs/start-sdk'

export const viewDevices = sdk.Action.withoutInput(
  'view-devices',
  async () => ({
    name: i18n('View Devices'),
    description: i18n(
      'List the devices registered on your tailnet and their status.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Devices'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const nodes = await listNodes(effects)
    if (!nodes.length) {
      return {
        version: '1',
        title: i18n('No Devices Yet'),
        message: i18n(
          'No devices have joined. Run Add Device to create a connection key.',
        ),
        result: null,
      }
    }
    const value: T.ActionResultMember[] = nodes.map((node) => ({
      type: 'group',
      name: node.name,
      description: node.addresses.join(', ') || null,
      value: [
        single(i18n('Addresses'), node.addresses.join(', ') || '—'),
        single(
          i18n('Status'),
          node.expired
            ? i18n('Expired')
            : node.connected
              ? i18n('Connected')
              : i18n('Disconnected'),
        ),
        single(i18n('Last seen'), node.lastSeen ?? i18n('Never')),
      ],
    }))
    return {
      version: '1',
      title: i18n('Tailnet Devices'),
      message: i18n('${count} device(s) are registered on this tailnet.', {
        count: nodes.length,
      }),
      result: { type: 'group', value },
    }
  },
)
