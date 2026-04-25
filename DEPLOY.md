# Deploying mintr to a DigitalOcean Droplet

A step-by-step path from a fresh Ubuntu 24.04 droplet to `https://mintrapp.com`
serving Pro purchases. Designed for a single $6/mo droplet (1 GB RAM).

## Prereqs

- Droplet created (Ubuntu 24.04, 1 GB RAM minimum, your SSH key attached)
- The droplet's public IPv4 address (`<DROPLET_IP>` below)
- A `.env.local` on your laptop with all production secrets ready to copy
- DNS access for `mintrapp.com`

## 1. Point DNS at the droplet

At your domain registrar, create two **A records**:

| Type | Host | Value |
|------|------|-------|
| A    | `@` (or `mintrapp.com`) | `<DROPLET_IP>` |
| A    | `www` | `<DROPLET_IP>` |

TTL: 300s (5 min) is fine. Propagation usually finishes in under a minute, but
budget 15 min before testing. You can check with `dig mintrapp.com +short`.

## 2. SSH in and install dependencies

```bash
ssh root@<DROPLET_IP>

# Update + base tooling
apt update && apt upgrade -y
apt install -y curl git ufw nginx

# Node 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# pm2 globally
npm install -g pm2

# Firewall — allow only SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 3. Pull the repo

```bash
mkdir -p /var/log/mintr
cd /opt
git clone https://github.com/r31d1337-bot/Make-it-into-money.git mintr
cd mintr
npm ci
```

## 4. Set production env

```bash
cd /opt/mintr
nano .env.local
```

Paste, replacing each `...` with your real value:

```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://mintrapp.com
AUTH_SECRET=<run `openssl rand -hex 32` and paste the output>
```

Save (Ctrl+O, Enter, Ctrl+X). The two **must-haves** are `AUTH_SECRET` and
`NEXT_PUBLIC_SITE_URL` — without them the server won't boot or links break.

`STRIPE_WEBHOOK_SECRET` and `EMAIL_FROM` come later (see §7 / §8). Without
those, the verify-fallback covers Stripe and Resend's default sender works
for your own inbox only.

## 5. Build + start with pm2

```bash
cd /opt/mintr
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root
# Run the command pm2 prints (it writes a systemd unit so the app survives reboot).
```

Smoke-test the app is up:

```bash
curl -I http://127.0.0.1:3000
# expect: HTTP/1.1 200 OK
```

## 6. Configure nginx + SSL

```bash
cp /opt/mintr/deploy/nginx.conf /etc/nginx/sites-available/mintrapp.com
ln -s /etc/nginx/sites-available/mintrapp.com /etc/nginx/sites-enabled/mintrapp.com
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Now grab a Let's Encrypt cert (free, auto-renews):

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mintrapp.com -d www.mintrapp.com --non-interactive \
  --agree-tos -m team@adroitventures.io --redirect
```

Test from your laptop:

```bash
curl -I https://mintrapp.com
# expect: HTTP/2 200, with valid Let's Encrypt cert
```

## 7. Register the production Stripe webhook

After the site is reachable over HTTPS:

1. Stripe dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://mintrapp.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret (`whsec_...`)
5. Add to droplet:
   ```bash
   echo "STRIPE_WEBHOOK_SECRET=whsec_..." >> /opt/mintr/.env.local
   pm2 restart mintr
   ```

## 8. Verify mintrapp.com in Resend

Without this, signup/reset emails to anyone other than your own inbox silently
drop.

1. Resend dashboard → **Domains → Add Domain → mintrapp.com**
2. Add the 3–4 DNS records Resend prints at your registrar (TXT for SPF + DKIM,
   one MX). Click **Verify**.
3. Once verified:
   ```bash
   echo 'EMAIL_FROM=mintr <hi@mintrapp.com>' >> /opt/mintr/.env.local
   pm2 restart mintr
   ```

## 9. Updating the app later

```bash
ssh root@<DROPLET_IP>
cd /opt/mintr
git pull
npm ci
npm run build
pm2 restart mintr
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pm2 logs mintr` shows `AUTH_SECRET env var is required` | You skipped step 4. Add it to `.env.local` and `pm2 restart mintr`. |
| 502 Bad Gateway from nginx | App isn't running. `pm2 status` then `pm2 logs mintr`. |
| Cert renewal failed | `certbot renew --dry-run`. Most often DNS for `www.mintrapp.com` was removed. |
| Build runs out of memory | 512 MB droplet — bump to 1 GB or larger. |
| Stripe webhook 400s | Wrong `STRIPE_WEBHOOK_SECRET`, or webhook is hitting `/api/stripe/webhook` over HTTP not HTTPS. |
