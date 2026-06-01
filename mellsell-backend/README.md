MEL-SELL Backend

Run (H2 profile, for local testing):

1. Build
   mvn -DskipTests clean package

2. Run (background)
   export MELSELL_ADMIN_EMAIL='francatorresmatheus@gmail.com'
   export MELSELL_ADMIN_PASSWORD='123123@'
   nohup java -jar target/mellsell-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=h2 > run-app.log 2>&1 & echo $! > run-app.pid
   tail -f run-app.log

3. Useful endpoints
   - Public products listing: GET /api/products
   - Auth: POST /api/auth/register, POST /api/auth/login
   - Cart, Orders, Reviews: protected endpoints (require JWT)
   - Admin reports (PDF): GET /api/admin/reports/sales?format=pdf
   - Admin export users by role: GET /api/admin/users/export?role=VENDEDOR

Notes
- Admin user is created at startup if env vars MELSELL_ADMIN_EMAIL and MELSELL_ADMIN_PASSWORD are set.
- This profile uses an in-memory H2 database (spring.profiles.active=h2) for quick testing.
- For production, configure MySQL and Flyway migrations.
