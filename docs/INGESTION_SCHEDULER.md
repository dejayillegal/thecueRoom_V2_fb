# Internal Feed Ingestion Scheduler

thecueRoom V2 utilizes an internal background scheduler for news feed ingestion, eliminating the need for external cron services.

## Architecture
The scheduler runs as a persistent loop within the Node.js process, initiated during server startup.

### Key Features
- **Database-Driven**: Configuration and scheduling state are stored in the `feed_ingestion_config` database table.
- **Polling Loop**: Every 60 seconds, the system checks if a new ingestion run is due.
- **Atomic Locking**: Uses a database flag (`is_running`) to ensure only one instance performs ingestion at any time.
- **Auto-Rescheduling**: Automatically calculates the next run time after completion based on the configured interval.

## Admin Configuration
Admins can manage the scheduler via the Admin Console (`/admin/cron`):
- **Enable/Disable**: Completely toggle the background process.
- **Interval**: Set frequency between 5 minutes and 24 hours.
- **Force Trigger**: Force the next scheduled run to happen on the next polling cycle.

## Behavior
- **Restarts**: If the server restarts, the scheduler reads the last state from the database and resumes.
- **Failover**: Errors are caught and logged to the database. The system releases the lock so the next cycle can proceed.
- **Non-Blocking**: Ingestion runs asynchronously and does not impact frontend performance.

## Production Notes
- Requires a stable database connection.
- In multi-instance environments, the database-level lock prevent duplicate processing.
- The scheduler only runs while the application process is active.

## Debugging
- Check `Last Error` in the Admin Dashboard.
- Monitor server logs for ingestion activity markers.
