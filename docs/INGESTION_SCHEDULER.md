# Internal Feed Ingestion Scheduler

The thecueRoom V2 utilizes an internal, database-driven background scheduler for automated feed ingestion. This system eliminates the dependency on external cron services (like GitHub Actions, Vercel Cron, or dedicated cron providers).

## Architecture
The scheduler runs as a persistent background loop within the Node.js process (integrated into the Next.js server startup).

### How it Works
1.  **Interval Loop**: A 60-second polling interval checks the database for due tasks.
2.  **State Source of Truth**: The `feed_ingestion_config` table stores the current state, interval, and schedule.
3.  **Atomic Locking**: Uses a `is_running` flag in the database to ensure that only one ingestion process executes at a time, even in multi-instance or clustered environments.
4.  **Automatic Rescheduling**: Upon successful completion, the system automatically calculates and sets the `next_run_at` timestamp based on the configured `interval_minutes`.

## Admin Configuration
Admins can manage the scheduler via the Admin Console (`/admin/cron`) or the following API endpoints:
- **GET `/api/admin/ingestion-config`**: View current status and settings.
- **PUT `/api/admin/ingestion-config`**:
    - `enabled` (boolean): Toggle the entire automated system.
    - `intervalMinutes` (int): Frequency of runs (min: 5, max: 1440).
    - `forceNextRun` (boolean): Resets the schedule to run immediately on the next tick.

## Reliability & Behavior
- **Restarts**: The scheduler is stateless across process restarts because it relies on the database. It will pick up exactly where it left off.
- **Failover**: If a run fails, the `last_error` is recorded, and the lock is released. The scheduler will attempt to run again at the next interval or when forced.
- **Non-Blocking**: The scheduler runs asynchronously and does not block the server's main thread or startup sequence.

## Production Notes
- **Database Availability**: The scheduler requires a stable connection to the PostgreSQL database. If the DB is unreachable, the scheduler will log errors and pause.
- **Instance Concurrency**: In environments with multiple replicas, the database-level lock prevents race conditions, ensuring only one instance performs the ingestion work at a time.
- **Server Persistence**: The scheduler depends on the application process being active. On platforms with aggressive "scale to zero" (like free-tier Heroku or Vercel standard functions), the scheduler only runs when the app is warm.

## Debugging Tips
1.  **Admin Console**: Visit `/admin/cron` to view the `Last Error` message and `Process State`.
2.  **Server Logs**: Monitor logs for `🕒 Scheduled ingestion trigger started...` and `✅ Scheduled ingestion completed successfully.`
3.  **Manual Reset**: If the system appears stuck, use the "Trigger Next Tick" button in the Admin Console to reset the state and force an immediate run.
