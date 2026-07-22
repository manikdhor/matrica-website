# How to run this website

This is a **Next.js** real estate website (admin panel + public site) that uses **Bun**, **Prisma**, and a **SQLite** database. Follow these steps once.

## 1. Install Bun (the runtime this project uses)

- **Windows (PowerShell):**
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **macOS / Linux:**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

Close and reopen your terminal after installing, then check it works:
```bash
bun --version
```

## 2. Open a terminal in this folder

Navigate into the project folder (the one containing `package.json`):
```bash
cd chandrachaya-website
```

## 3. Install dependencies

```bash
bun install
```
This creates the `node_modules` folder (it was not included in the download to keep the file small).

## 4. Set up the database

The project ships with a SQLite database at `db/custom.db`. Generate the Prisma client and sync the schema:
```bash
bun run db:generate
bun run db:push
```

## 5. Start the site (development)

```bash
bun run dev
```
Then open **http://localhost:3000** in your browser.

- Public site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`

## Notes

- **What was wrong with the download:** the file you got was a `.tar` archive saved *without* a file extension, so your computer didn't know it was a compressed bundle and couldn't open it. It has now been extracted into this proper folder.
- **Database path fix:** the original `.env` pointed at `file:/home/z/my-project/db/custom.db` (a path from the cloud build server). It has been corrected to `file:./db/custom.db` so it works on your machine.
- **AI features:** some admin features call AI APIs. If those are used, you may need to add the relevant API key(s) to the `.env` file. The site itself runs without them.
- The many `*.png` and `screenshot-*.png` files in the root are leftover development screenshots — safe to delete; they are not part of the website.
