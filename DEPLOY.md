# Deploy to cPanel (Node.js) with auto-sync from GitHub

There are two paths. **Host-side** is the active one for this project (GitHub
Actions is billing-locked on the account); the Actions path is kept for when
billing is restored.

- **Host-side (active):** the cPanel host clones the repo, builds on the host,
  and a cron job pulls + rebuilds every few minutes. No GitHub Actions needed.
  See [Host-side deploy](#host-side-deploy-active) below.
- **GitHub Actions (needs billing):** CI builds the standalone bundle and rsyncs
  it over SSH. See the original setup after the host-side section.

---

## Host-side deploy (active)

The script `scripts/host-deploy.sh` clones/pulls master, builds via the cPanel
Node virtualenv, rsyncs `.next/standalone/` into the app root, and reloads
Passenger. A cron job runs it with `--auto` so it only rebuilds on new commits.

**One-time bootstrap (cPanel Terminal):**

```bash
# 1. clone (deploy key already authorized)
git clone git@github.com:manikdhor/matrica_final.git ~/matrica-src

# 2. build-time env — create with your real values (survives pulls; gitignored)
cat > ~/matrica-src/.env <<'EOF'
DATABASE_URL=...your Supabase pooled URL...
DIRECT_URL=...your Supabase direct URL...
EOF

# 3. first build + deploy
chmod +x ~/matrica-src/scripts/host-deploy.sh
~/matrica-src/scripts/host-deploy.sh

# 4. auto-sync every 5 min
( crontab -l 2>/dev/null | grep -v host-deploy; \
  echo "*/5 * * * * \$HOME/matrica-src/scripts/host-deploy.sh --auto >> \$HOME/deploy.log 2>&1" ) | crontab -
```

**Also set runtime env** in the cPanel Node app (Environment variables →
ADD VARIABLE → SAVE): `DATABASE_URL`, `DIRECT_URL`. `UPLOAD_DIR` + `LOG_LEVEL`
are already set. Passenger injects these at runtime; the `.env` above is only
read during the build.

Logs: `~/deploy.log`. Manual redeploy: rerun step 3.

---

## 1. Create the Node.js app in cPanel

cPanel → **Setup Node.js App** → **Create Application**

| Field | Value |
|-------|-------|
| Node.js version | **20** (or the highest available, must be ≥ 18.18) |
| Application mode | **Production** |
| Application root | e.g. `matrica`  → becomes `/home/<USER>/matrica` |
| Application URL | your domain / subdomain |
| Application startup file | **`server.js`** |

Click **Create**. cPanel creates the app root + a `tmp/` folder and wires
Passenger + an `.htaccess` in the domain docroot. Leave those alone.

### Environment variables (same screen, "Add Variable")

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | **absolute path OUTSIDE the app root**, e.g. `/home/<USER>/matrica-uploads` |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` / `AI_PROVIDER` | only if AI chat is used |

- **Do NOT set `PORT`** — Passenger sets it; the standalone server reads it.
- Create the uploads folder once over SSH: `mkdir -p ~/matrica-uploads`.
  Keeping it outside the app root means redeploys never wipe uploaded media.

Click **Save**, then **Restart**.

---

## 2. Make an SSH deploy key

On your PC:

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

- **Public** key (`deploy_key.pub`) → add to the host:
  cPanel → **SSH Access → Manage SSH Keys → Import** (or append the line to
  `~/.ssh/authorized_keys`), then **Authorize** it.
- **Private** key (`deploy_key`, the whole file incl. header/footer lines) →
  goes into the GitHub secret `SSH_KEY` (next step).

Confirm SSH works: `ssh -p <PORT> <USER>@<HOST>` (some hosts use a custom port,
e.g. Namecheap = `21098`).

---

## 3. Add GitHub repository secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example |
|--------|---------|
| `SSH_HOST` | server hostname or IP |
| `SSH_USER` | your cPanel username |
| `SSH_PORT` | `22` (or host-specific, e.g. `21098`) |
| `SSH_KEY` | contents of the **private** `deploy_key` file |
| `APP_ROOT` | absolute app root, e.g. `/home/<USER>/matrica` |

---

## 4. First deploy

- Push to `master`, **or** GitHub → Actions → "Deploy to cPanel" → **Run workflow**.
- Watch the Actions log. On success the site is live at your domain.

The workflow (`.github/workflows/deploy.yml`) rsyncs `.next/standalone/` into
the app root, so `server.js`, the traced `node_modules`, `.next/static`, and
`public` all land at the root — exactly what the `server.js` startup file needs.

---

## 5. Database schema changes

The DB (Supabase Postgres) is **not** touched by the deploy. This project uses
`prisma db push`, not migrations. When you change `prisma/schema.prisma`, apply
it manually once:

```bash
# locally, with DATABASE_URL/DIRECT_URL pointing at the prod Supabase DB
npm run db:push
```

---

## Troubleshooting

- **502 / app won't boot** → cPanel → your Node app → check the log, or
  `~/<APP_ROOT>/stderr.log`. Usually a missing env var.
- **Images serve full-size / sharp error** → the build ships `@img` libvips;
  confirm the host is Linux x64. Handled by `scripts/copy-standalone.mjs`.
- **Prisma "query engine not found"** → the build ships rhel + debian engines
  (openssl 1.1 + 3.0) via `binaryTargets`. If it still fails, note the host OS
  and add its exact target to `prisma/schema.prisma`.
- **Uploads disappear after deploy** → `UPLOAD_DIR` isn't set to a path outside
  the app root. Fix the env var and restart.
- **Manual restart** → `touch ~/<APP_ROOT>/tmp/restart.txt` or the cPanel
  **Restart** button.
