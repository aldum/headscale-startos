import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { controlUrlsOnce } from '../endpoint'
import { bestServerUrl, connectionCommand } from '../utils'
import { ensureUser, headscaleCliJson, readStore, single } from './helpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  expiration: Value.select({
    name: i18n('Key expires after'),
    description: i18n(
      'Unused keys stop working when they expire. Used devices keep working.',
    ),
    warning: null,
    default: '24h',
    values: {
      '1h': i18n('1 hour'),
      '24h': i18n('24 hours'),
      '7d': i18n('7 days'),
      '30d': i18n('30 days'),
    },
  }),
  reusable: Value.toggle({
    name: i18n('Reusable key'),
    description: i18n(
      'Let the key connect more than one device. Use it for a batch of machines you manage.',
    ),
    warning: i18n(
      'A reusable key stays powerful until it expires. Keep it private.',
    ),
    default: false,
  }),
  ephemeral: Value.toggle({
    name: i18n('Ephemeral device'),
    description: i18n(
      'The device is removed from the tailnet after 30 minutes offline.',
    ),
    warning: null,
    default: false,
  }),
})

type CreatedKey = { key?: string }

export const addDevice = sdk.Action.withInput(
  'add-device',
  async () => ({
    name: i18n('Add Device'),
    description: i18n(
      'Create a connection key and the command to run on your device.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Devices'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    const serverUrl = bestServerUrl(
      (await readStore()).endpointUrl,
      await controlUrlsOnce(effects),
    )
    if (!serverUrl) {
      throw new Error(i18n('Run Set Primary URL before starting the service.'))
    }
    const userId = await ensureUser(effects)
    const args = [
      'preauthkeys',
      'create',
      '--user',
      String(userId),
      '--expiration',
      input.expiration,
    ]
    if (input.reusable) args.push('--reusable')
    if (input.ephemeral) args.push('--ephemeral')
    const created = (await headscaleCliJson(effects, args)) as CreatedKey
    const key = created.key
    if (!key) {
      throw new Error(i18n('Headscale did not return a connection key.'))
    }
    return {
      version: '1',
      title: i18n('Device Key Created'),
      message: i18n(
        'Install Tailscale on your device, then run this command. Anyone who holds this key can join your tailnet until it expires.',
      ),
      result: {
        type: 'group',
        value: [
          single(i18n('Connection key'), key, {
            masked: true,
            copyable: true,
          }),
          single(i18n('Connect command'), connectionCommand(serverUrl, key), {
            copyable: true,
          }),
        ],
      },
    }
  },
)
