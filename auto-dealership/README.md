

## Розгортання на Railway

1. Завантажте папку проєкту в репозиторій GitHub (без `node_modules`).
2. На [railway.app](https://railway.app): **New Project -> Deploy from GitHub repo**.
3. Додайте базу: **New -> Database -> Add PostgreSQL**.
4. У **Variables** сервіса додайте `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
5. У **Settings -> Networking -> Generate Domain** створіть публічну адресу.
6. Після деплою заповніть базу демо-даними: `npm run seed`
   (через Railway Shell сервіса, або локально з встановленим `DATABASE_URL`).

Код підтримує як `DATABASE_URL` (хмара), так і окремі `DB_*` змінні
(локальний запуск, див. `.env.example`).
