import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { store } from '../fileModels/store.json'
import { readStore } from './helpers'

const { InputSpec, Value } = sdk

const DOMAIN_PATTERN =
  '^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$'

const inputSpec = InputSpec.of({
  baseDomain: Value.dynamicText(async () => ({
    name: i18n('Tailnet domain'),
    description: i18n(
      'The private domain MagicDNS appends to device names, e.g. tsnet.home. Must be a domain and must differ from the server address.',
    ),
    required: true,
    default: (await readStore()).baseDomain ?? null,
    placeholder: 'tsnet.home',
    minLength: 4,
    maxLength: 253,
    patterns: [
      {
        regex: DOMAIN_PATTERN,
        description: i18n('Enter a valid domain name, such as tsnet.home.'),
      },
    ],
  })),
})

export const setupDns = sdk.Action.withInput(
  'setup-dns',
  async () => ({
    name: i18n('Set Up MagicDNS'),
    description: i18n('Give every device on your tailnet a private DNS name.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Settings'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    await store.merge(effects, {
      baseDomain: input.baseDomain.toLowerCase(),
    })
    return {
      version: '1',
      title: i18n('MagicDNS Configured'),
      message: i18n(
        'Devices on your tailnet can now resolve each other under ${domain}.',
        { domain: input.baseDomain.toLowerCase() },
      ),
      result: null,
    }
  },
)
