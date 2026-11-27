import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'headscale',
  title: 'Headscale',
  license: 'BSD-3-Clause',
  packageRepo: 'https://github.com/aldum/headscale-startos',
  upstreamRepo: 'https://github.com/juanfont/headscale',
  marketingUrl: 'https://headscale.net/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    headscale: {
      source: { dockerTag: 'ghcr.io/juanfont/headscale:v0.29.3' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
