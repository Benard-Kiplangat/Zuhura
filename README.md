# Zuhura Mart (static)

Pure HTML/CSS/JS. No server. Orders are sent to your WhatsApp.

- Preview locally: `python3 -m http.server 8000` then open http://localhost:8000
- Set your number in `app.js` (`CFG.whatsapp`, format 2547XXXXXXXX)
- Edit products, prices and stock in `products.json`, commit, and the site redeploys

## Deploy on Render
New > Static Site > pick your repo. Build command: leave blank. Publish directory: `.`
