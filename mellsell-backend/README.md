MEL-SELL Backend

### MySQL (padrão — recomendado)

Requer **Podman** ou **Docker** (ou MySQL local na porta 3306):

```bash
chmod +x run-mysql.sh
export MELSELL_ADMIN_EMAIL='admin@example.com'
export MELSELL_ADMIN_PASSWORD='admin123'
./run-mysql.sh
```

Só o banco: `./run-mysql.sh --mysql-only`

Variáveis opcionais: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`.

### H2 (desenvolvimento rápido, sem container)

1. Build: `mvn -DskipTests clean package`
2. Run:
   ```bash
   export MELSELL_ADMIN_EMAIL='admin@example.com'
   export MELSELL_ADMIN_PASSWORD='admin123'
   nohup java -jar target/mellsell-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=h2 > run-app.log 2>&1 & echo $! > run-app.pid
   tail -f run-app.log
   ```

3. Useful endpoints
   - Public products listing: GET /api/products
   - Auth: POST /api/auth/register, POST /api/auth/login
   - Cart, Orders, Reviews: protected endpoints (require JWT)
   - Admin reports (PDF): GET /api/admin/reports/sales?format=pdf
   - Admin export users by role: GET /api/admin/users/export?role=VENDEDOR

Notes
- Admin user is created at startup if env vars MELSELL_ADMIN_EMAIL and MELSELL_ADMIN_PASSWORD are set.
- **mysql** (padrão) — MySQL 8 + Flyway; dados persistem (`./run-mysql.sh`).
- **h2** — banco em memória (some ao reiniciar).
- **presentation** — H2 em arquivo em `data/presentation/` (sem MySQL; patch automático de colunas).

### Apresentação (faculdade)

```bash
chmod +x run-presentation.sh
./run-presentation.sh
```

Opcional: admin personalizado

```bash
export MELSELL_ADMIN_EMAIL='seu@email.com'
export MELSELL_ADMIN_PASSWORD='sua-senha'
./run-presentation.sh
```

Frontend (outro terminal):

```bash
cd ../mellsell-frontend && npm run dev
```
