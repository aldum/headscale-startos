import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { listNodes, nodeLabel } from './helpers'

const { InputSpec, Value } = sdk

export const deviceInputSpec = InputSpec.of({
  id: Value.dynamicSelect(async ({ effects }) => {
    let nodes: Awaited<ReturnType<typeof listNodes>> = []
    try {
      nodes = await listNodes(effects)
    } catch {
      nodes = []
    }
    return {
      name: i18n('Device'),
      description: i18n('Choose which device to act on.'),
      values: Object.fromEntries(
        nodes.map((node) => [String(node.id), nodeLabel(node)]),
      ),
      default: nodes[0]?.id ? String(nodes[0].id) : '',
      disabled: nodes.length
        ? false
        : i18n('No devices are registered on this tailnet yet.'),
    }
  }),
})
