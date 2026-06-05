# Backend Setup

This LP is prepared for Cloudflare Pages Functions and Cloudflare D1.

## 1. Create the D1 database

```powershell
npx wrangler d1 create lumina-dew-lp
```

Copy the returned `database_id` into `wrangler.toml`.

If you want to manage bindings with Wrangler, copy `wrangler.example.toml` to `wrangler.toml` first.
If you prefer the Cloudflare dashboard, you can skip `wrangler.toml` and add the D1 binding named `DB` in the Pages project settings.

## 2. Apply migrations

```powershell
npx wrangler d1 migrations apply lumina-dew-lp --remote
```

## 3. Set the admin password

Set a Cloudflare Pages environment variable:

```text
ADMIN_TOKEN=your-long-admin-password
```

The admin page uses this value as the password for `/admin.html`.

## 4. Deploy on Cloudflare Pages

Connect this GitHub repository to Cloudflare Pages.

Build command: none

Build output directory: `.`

Functions directory: `functions`
