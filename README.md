# Zuhura Mart (MVP)

Gadgets storefront + cart + checkout + admin. No dependencies, only Node 18+.

    node server.js        # then open http://localhost:3000

- Storefront: `/`   · Admin: `/admin` (default password `zuhura123`)
- Change the password: `ADMIN_PASSWORD=yoursecret node server.js`
- Set your WhatsApp number in `public/app.js` (`CFG.whatsapp`, format 2547XXXXXXXX)
- Data lives in `data/products.json` and `data/orders.json`
- Prices and stock are always checked on the server, never trusted from the browser

## Before you go live
1. **M-Pesa:** `stkPush()` in `server.js` is a simulation. Replace it with Safaricom Daraja STK Push and mark orders `paid` from the callback.
2. **Database:** JSON files are fine for testing. Move to SQLite or Postgres before real traffic.
3. **Hosting:** deploy behind HTTPS (Render, Railway, a VPS) and set a strong `ADMIN_PASSWORD`.
4. **Images:** add a product image URL in admin, or drop files in `public/` and use `/file.jpg`.
