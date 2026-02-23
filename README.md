# Family Tree App

Basic but scalable family-tree MVP:
- React + TypeScript UI
- Express + Prisma + SQLite backend
- People CRUD + relationship graph highlighting
- Residency history support

## Data model
- Person: firstName (required), lastName (optional), birthDate/deathDate (optional), nationality (required), notes
- Residency: country + optional from/to + current flag
- Relationship: fromPerson, toPerson, type (PARENT/SPOUSE/SIBLING/CHILD)

## Run locally
```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```
App: http://localhost:5173 (Vite)
API: http://localhost:3000

## Production build
```bash
npm run build
PORT=3000 DATABASE_URL="file:./prisma/dev.db" node dist-server/index.js
```

## Docker
```bash
docker compose up --build -d
```

## Deploy on familytree.crmkanka.com (Nginx + Let's Encrypt)

### 1) On VPS
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git
git clone <YOUR_REPO_URL> /opt/familytree
cd /opt/familytree
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run build
```

### 2) Run app with PM2 (or systemd)
```bash
npm i -g pm2
PORT=3000 DATABASE_URL="file:/opt/familytree/prisma/dev.db" pm2 start dist-server/index.js --name familytree
pm2 save
pm2 startup
```

### 3) Nginx site config
Create `/etc/nginx/sites-available/familytree.crmkanka.com`:
```nginx
server {
  listen 80;
  server_name familytree.crmkanka.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```
Then:
```bash
sudo ln -s /etc/nginx/sites-available/familytree.crmkanka.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4) SSL
```bash
sudo certbot --nginx -d familytree.crmkanka.com
```

## Notes
- Public write access for now (no auth)
- Easy to extend to bigger graph logic later (pagination, server-side layout, graph DB adapters)
