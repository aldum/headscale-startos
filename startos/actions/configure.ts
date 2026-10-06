import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { enabledControlUrls } from '../endpoint'
import { store } from '../fileModels/store.json'
import { readStore } from './helpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  address: Value.dynamicSelect(async ({ effects }) => {
    const urls = await enabledControlUrls(effects)
    const current = (await readStore()).endpointUrl
    const values = Object.fromEntries(
      urls.map((url) => [url, url.replace(/^https?:\/\//, '')]),
    )
    if (current && !(current in values)) {
      values[current] = `${current.replace(/^https?:\/\//, '')} (${i18n(
        'no longer enabled',
      )})`
    }
    return {
      name: i18n('Server address'),
      description: i18n(
        'The address your devices will connect to. The StartOS TLS certificate must be trusted on each device.',
      ),
      values,
      default: current ?? urls[0] ?? '',
      disabled: urls.length
        ? false
        : i18n('Enable a LAN address under Headscale > Interfaces first.'),
    }
  }),
})

export const configure = sdk.Action.withInput(
  'configure',
  async () => ({
    name: i18n('Configure Headscale'),
    description: i18n('Choose the address your devices connect to.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Settings'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    await store.merge(effects, {
      endpointUrl: input.address,
    })
    return {
      version: '1',
      title: i18n('Configuration Saved'),
      message: i18n('Headscale will restart and advertise ${address}.', {
        address: input.address,
      }),
      result: null,
    }
  },
)
