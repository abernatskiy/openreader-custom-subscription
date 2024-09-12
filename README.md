# A custom OpenReader subscription

> [!CAUTION]
> This code may leak memory

This is an example squid with a custom subscription resolver that periodically sends the squid height to the client. Intended as a proof of concept, not as a production-ready solution.

Prepare the squid with

```bash
git clone https://github.com/abernatskiy/openreader-custom-subscription
cd openreader-custom-subscription
npm ci
sqd build
```

Then open three command line windows and run

```bash
sqd process
```
```bash
sqd serve
```
```bash
node scripts/client.js
```

(see `commands.json` for details on `sqd build/process/serve`).
