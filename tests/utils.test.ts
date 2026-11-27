import assert from 'node:assert/strict'
import test from 'node:test'
import { bestServerUrl } from '../startos/utils.ts'
import {
  parseNodes,
  renderDerpMap,
  renderHeadscaleConfig,
} from '../startos/utils.ts'

test('renderDerpMap advertises the live external ports', () => {
  const rendered = renderDerpMap({
    hostname: '10.100.0.100',
    derpPort: 8080,
    stunPort: 54040,
  })
  assert.match(rendered, /hostname: 10\.100\.0\.100/)
  assert.match(rendered, /derpport: 8080/)
  assert.match(rendered, /stunport: 54040/)
  assert.match(rendered, /regionid: 999/)
  assert.match(rendered, /regioncode: headscale/)
})

test('renderHeadscaleConfig trims the server URL', () => {
  const rendered = renderHeadscaleConfig({
    endpointUrl: 'https://10.100.0.100:8080///',
    baseDomain: null,
  })
  assert.match(rendered, /server_url: 'https:\/\/10\.100\.0\.100:8080'/)
})

test('renderHeadscaleConfig keeps magic_dns off until a domain is set', () => {
  const unset = renderHeadscaleConfig({
    endpointUrl: 'https://10.100.0.100:8080',
    baseDomain: null,
  })
  assert.match(unset, /magic_dns: false/)
  assert.match(unset, /base_domain: ''/)

  const set = renderHeadscaleConfig({
    endpointUrl: 'https://10.100.0.100:8080',
    baseDomain: 'tsnet.home',
  })
  assert.match(set, /magic_dns: true/)
  assert.match(set, /base_domain: 'tsnet\.home'/)
})

test('renderHeadscaleConfig serves TLS itself with the embedded relay on', () => {
  const rendered = renderHeadscaleConfig({
    endpointUrl: 'https://10.100.0.100:8080',
    baseDomain: 'tsnet.home',
  })
  assert.match(rendered, /tls_cert_path: '\/data\/tls\.crt'/)
  assert.match(rendered, /tls_key_path: '\/data\/tls\.key'/)
  assert.match(rendered, /enabled: true/)
  assert.match(rendered, /stun_listen_addr: '0\.0\.0\.0:3478'/)
  assert.match(rendered, /automatically_add_embedded_derp_region: false/)
  assert.match(rendered, /urls: \[\]/)
  assert.match(rendered, /- '\/data\/derp\.yaml'/)
})

test('parseNodes reads the 0.29.x snake_case shape', () => {
  const nodes = parseNodes([
    {
      id: 1,
      given_name: 'laptop',
      ip_addresses: ['100.64.0.1', 'fd7a:115c:a1e0::1'],
      user: { name: 'primary' },
      online: true,
      expiry: '2999-01-01T00:00:00Z',
      last_seen: '2026-10-06T20:33:00Z',
      created_at: '2026-10-06T20:00:00Z',
    },
  ])
  assert.equal(nodes.length, 1)
  assert.equal(nodes[0].name, 'laptop')
  assert.deepEqual(nodes[0].addresses, ['100.64.0.1', 'fd7a:115c:a1e0::1'])
  assert.equal(nodes[0].user, 'primary')
  assert.equal(nodes[0].connected, true)
  assert.equal(nodes[0].expired, false)
  assert.equal(nodes[0].lastSeen, '2026-10-06 20:33')
})

test('parseNodes derives expiry from a past timestamp', () => {
  const nodes = parseNodes([
    {
      id: 2,
      given_name: 'phone',
      ip_addresses: ['100.64.0.2'],
      user: { name: 'primary' },
      online: false,
      expiry: '2020-01-01T00:00:00Z',
      last_seen: '0001-01-01T00:00:00Z',
      created_at: '0001-01-01T00:00:00Z',
    },
  ])
  assert.equal(nodes[0].expired, true)
  assert.equal(nodes[0].connected, false)
  assert.equal(nodes[0].lastSeen, null)
})

test('parseNodes drops entries without an integer id', () => {
  assert.deepEqual(parseNodes(null), [])
  assert.deepEqual(parseNodes([{ given_name: 'ghost' }]), [])
  assert.deepEqual(parseNodes([{ id: 'abc' }]), [])
})

test('bestServerUrl follows a stored hostname to its current port', () => {
  const urls = [
    'https://10.100.0.100:8443',
    'https://head.example.com:8443',
    'https://illegal-whiz.local:8443',
  ]
  assert.equal(
    bestServerUrl('https://head.example.com:8443', urls),
    'https://head.example.com:8443',
  )
  assert.equal(
    bestServerUrl('https://head.example.com:8080', urls),
    'https://head.example.com:8443',
  )
})

test('bestServerUrl is null when nothing is chosen or the hostname is gone', () => {
  const urls = ['https://10.100.0.100:8443']
  assert.equal(bestServerUrl(null, urls), null)
  assert.equal(bestServerUrl(undefined, urls), null)
  assert.equal(bestServerUrl('', urls), null)
  assert.equal(bestServerUrl('https://gone.example.com:8443', urls), null)
  assert.equal(bestServerUrl('not a url', urls), null)
})
