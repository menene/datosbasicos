# datosbasicos

## Agent Instructions
For all Thundera agent personas (Rick, Morty) and execution protocols, refer strictly to `AGENTS.md`.

> **🛑 CRITICAL ANTI-WIPE PROTOCOL:** You MUST NEVER run `php artisan test`, `pest`, or `migrate:fresh` without EXPLICITLY verifying that `phpunit.xml` or `.env.testing` uses a dedicated testing database (e.g., `DB_DATABASE=app_testing`). We use a dual-database setup (testing and dev use the same DBMS engine). If the database name ends in `_testing` (or `testing.sqlite`), you are fully authorized to run tests autonomously. Check the database connection EVERY SINGLE TIME before testing.
