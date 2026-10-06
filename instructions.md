# Headscale

## Documentation

- [Headscale documentation](https://headscale.net/stable/) — the upstream reference: configuration, DNS, DERP, policy, and the API.

## What you get on StartOS

Headscale turns your StartOS server into the coordination server for your own tailnet — the private network that Tailscale clients join. Your phones, laptops, and servers keep using the official Tailscale apps; only the control server is yours. The StartOS package manages headscale's configuration for you, exposes the API devices connect to over the network, and gives you StartOS actions to hand out connection keys and manage the devices that have joined.

## Getting set up

1. On the Headscale page, complete the **Choose the address your devices will connect to** task by running **Configure Headscale**. Pick the address your devices will use — usually the `.local` or LAN IP address on the **Coordination API** interface. The service starts once you save.
2. Run **Set Up MagicDNS** to choose a private domain for your network (for example `tsnet.home`). Devices can then reach each other by name.
3. Run **Add Device** to create a connection key. The result shows the full `tailscale up` command to run on the device — copy it there.

### Trusting the certificate on each device

Devices connect to Headscale over HTTPS at your StartOS address, which uses your server's certificate. Before a device can join:

- On computers, download your server's Root CA (from the **About this Server** screen in the StartOS menu, or by visiting the server's plain-HTTP `.local` address) and install it in that device's trust store. Tailscale reports an error like `certificate signed by unknown authority` until you do.
- Phones and tablets generally cannot be made to trust a custom root certificate. To join from mobile devices, add a public address with a trusted certificate to the Coordination API interface (for example through StartTunnel), then select it in **Configure Headscale**.

## Using Headscale

- **Add Device** — mints a connection key and shows the exact command to run on the device. Keys expire on a schedule you choose; a device that has already joined keeps working after its key expires.
- **View Devices** — lists every device on the tailnet with its addresses and whether it is connected.
- **Expire Device** — logs a device out; it must reauthenticate to rejoin. Repeat-safe.
- **Remove Device** — deletes a device outright. Use **Expire Device** first if you think you might want the device back — removal requires a new key to rejoin.
- **Configure Headscale** — change the server address. The service restarts and reannounces itself.
- **Set Up MagicDNS** — change the tailnet domain.

## Limitations

- The StartOS certificate caveat above is the single most common reason a device fails to join. If `tailscale up` reports a TLS error, the device doesn't yet trust your server.
- This package starts with no access-control restrictions: every device that joins with a key can reach every other device. Upstream supports fine-grained policies via a policy file; the package ships the default allow-all policy.
- Interactive (browser) registration without a key requires OIDC, which this package does not configure — every device joins with a key from **Add Device**.
- When two devices cannot connect directly, traffic is relayed through Headscale's own embedded DERP relay on your box (with a STUN server on the DERP Relay interface), so relayed traffic stays on your network. There is deliberately no fallback to Tailscale's public relays: if a device cannot reach your box, it cannot relay either.
