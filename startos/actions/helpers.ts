import { randomUUID } from 'node:crypto'
import { T } from '@start9labs/start-sdk'
import { emptyStore, store, Store } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  cliCommand,
  defaultUser,
  HeadscaleConfig,
  parseNodes,
  TailnetNode,
} from '../utils'

export async function readStore(): Promise<Store> {
  return (await store.read().once()) ?? emptyStore()
}

export function requireConfigured(current: Store): HeadscaleConfig {
  if (!current.endpointUrl) {
    throw new Error(
      i18n('Run Configure Headscale before starting the service.'),
    )
  }
  return {
    endpointUrl: current.endpointUrl,
    baseDomain: current.baseDomain,
  }
}

export async function headscaleCli(
  effects: T.Effects,
  args: string[],
): Promise<string> {
  const result = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'headscale' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    `headscale-cli-${randomUUID()}`,
    async (sub) => sub.exec(cliCommand(args), { user: 'root' }),
  )
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim()
    throw new Error(
      stderr || i18n('The headscale command failed unexpectedly.'),
    )
  }
  return result.stdout.toString()
}

export async function headscaleCliJson(
  effects: T.Effects,
  args: string[],
): Promise<unknown> {
  return JSON.parse(
    (await headscaleCli(effects, [...args, '-o', 'json'])) || 'null',
  )
}

type HeadScaleUser = { id: number; name: string }

export async function listUsers(effects: T.Effects): Promise<HeadScaleUser[]> {
  const raw = await headscaleCliJson(effects, ['users', 'list'])
  const list = Array.isArray(raw) ? raw : []
  return list.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const user = entry as Record<string, unknown>
    const id = Number(user.id)
    if (!Number.isInteger(id)) return []
    return [{ id, name: String(user.name ?? '') }]
  })
}

export async function ensureUser(effects: T.Effects): Promise<number> {
  const users = await listUsers(effects)
  const existing = users.find((user) => user.name === defaultUser)
  if (existing) return existing.id
  await headscaleCli(effects, ['users', 'create', defaultUser])
  const created = (await listUsers(effects)).find(
    (user) => user.name === defaultUser,
  )
  if (!created) {
    throw new Error(i18n('Headscale could not create its default user.'))
  }
  return created.id
}

export async function listNodes(effects: T.Effects): Promise<TailnetNode[]> {
  return parseNodes(await headscaleCliJson(effects, ['nodes', 'list']))
}

export function nodeLabel(node: TailnetNode): string {
  return `${node.name} (#${node.id})`
}

export function single(
  name: string,
  value: string,
  options: Partial<
    Pick<T.ActionResultMember & { type: 'single' }, 'masked' | 'copyable'>
  > = {},
): T.ActionResultMember {
  return {
    type: 'single',
    name,
    description: null,
    value,
    copyable: options.copyable ?? false,
    masked: options.masked ?? false,
    qr: false,
  }
}
