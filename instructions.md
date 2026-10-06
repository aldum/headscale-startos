# Headscale

## Documentation

- [Headscale documentation](https://headscale.net/stable/) — the upstream reference: configuration, DNS, DERP, policy, and the API.

## What you get on StartOS

Headscale turns your StartOS server into the coordination server for your own tailnet — the private network that Tailscale clients join. Your phones, laptops, and servers keep using the official Tailscale apps; only the control server is yours. The StartOS package manages headscale's configuration for you, exposes the API devices connect to over the network, and gives you StartOS actions to hand out connection keys and manage the devices that have joined.

## Getting set up

1. On the Headscale page, complete the **Choose the address your devices will connect to** task by running **Set Primary URL**. Pick the address your devices will use — usually the `.local` or LAN IP address on the **Coordination API** interface. The service starts once you save.
2. Run **Set Up MagicDNS** to choose a private domain for your network (for example `tsnet.home`). Devices can then reach each other by name.
3. Run **Add Device** to create a connection key. The result shows the full `tailscale up` command to run on the device — copy it there.

## Trusting your server on each device

Devices reach Headscale over HTTPS using your server's certificate, signed by your server's private root CA. Until a device trusts that CA, joining fails with `certificate signed by unknown authority`. Download the CA (from the **About this Server** screen in the StartOS menu, or by visiting the server's plain-HTTP `.local` address) and install it:

- **Linux (Debian/Ubuntu):** copy the `.crt` to `/usr/local/share/ca-certificates/` and run `sudo update-ca-certificates`. **Fedora/RHEL:** copy it to `/etc/pki/ca-trust/source/anchors/` and run `sudo update-ca-trust`. Restart tailscaled afterwards (`sudo systemctl restart tailscaled`) — it reads the trust store once at startup.
- **Windows:** double-click the `.crt`, install it to Local Machine → Trusted Root Certification Authorities.
- **macOS:** add it to the System keychain and set it to Always Trust.
- **Android:** Settings → Security → install a CA certificate, and select the file. Needs a recent Tailscale app — only newer clients pick up user-installed CAs.
- **iPhone/iPad:** get the `.crt` onto the phone (email or file share), open it to install the profile, then enable full trust under Settings → General → About → Certificate Trust Settings.

## Joining your devices

Use a Tailscale client of version 1.80 or newer — the server refuses older ones. You need two things: the server address you picked in **Set Primary URL**, and a key from **Add Device** (choose Reusable if several devices will share it; a device that already joined keeps working after its key expires).

- **Linux / Windows / macOS:** install the official client, then run the command **Add Device** shows you:
  `tailscale up --login-server=https://<your-server-address> --auth-key=<key>`
- **Android:** install the official app, then in the app go to Settings → Accounts, open the ⋮ menu and pick **Use an alternate server**, and enter your server address. If a browser login opens, close it. Open the ⋮ menu again, pick **Use an auth key**, and paste the key from **Add Device**. Tap Connect.
- **iPhone/iPad:** install the official app (1.80+). On the sign-in screen open the ⋮ menu, pick **Use an auth key**, enter your server address in the custom-server field, paste the key, and confirm.

## Using your tailnet

- `tailscale status` lists your devices with their tailnet addresses (`100.64.0.x`).
- `tailscale ping <address-or-name>` checks reachability — e.g. `tailscale ping laptop.tsnet.home` once MagicDNS is set up.
- `tailscale netcheck` shows the path report. Expect a `headscale` region with LAN-scale latency: that is your own box relaying. When two devices cannot connect directly, traffic relays through it and stays on your network.
- Devices join with keys, never passwords. A key is single-purpose: mint a fresh one per device (or one reusable key for a batch), and use **Expire Device** to log a device out or **Remove Device** to delete it outright.

## Using Headscale

- **Add Device** — mints a connection key and shows the exact command to run on the device. Keys expire on a schedule you choose; a device that has already joined keeps working after its key expires.
- **View Devices** — lists every device on the tailnet with its addresses and whether it is connected.
- **Expire Device** — logs a device out; it must reauthenticate to rejoin. Repeat-safe.
- **Remove Device** — deletes a device outright. Use **Expire Device** first if you think you might want the device back — removal requires a new key to rejoin.
- **Set Primary URL** — change the server address. The service restarts and reannounces itself.
- **Set Up MagicDNS** — change the tailnet domain.

## Limitations

- The StartOS certificate step above is the single most common reason a device fails to join. If `tailscale up` reports a TLS error, the device doesn't yet trust your server. On old Android clients and some iOS versions, trusting a private CA does not work at all — keep the Tailscale app updated.
- This package starts with no access-control restrictions: every device that joins with a key can reach every other device. Upstream supports fine-grained policies via a policy file; the package ships the default allow-all policy.
- Interactive (browser) registration without a key requires OIDC, which this package does not configure — every device joins with a key from **Add Device**.
- When two devices cannot connect directly, traffic is relayed through Headscale's own embedded DERP relay on your box (with a STUN server on the DERP Relay interface), so relayed traffic stays on your network. There is deliberately no fallback to Tailscale's public relays: if a device cannot reach your box, it cannot relay either.
