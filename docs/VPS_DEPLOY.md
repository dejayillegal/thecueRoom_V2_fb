# VPS Deployment Guide (Ubuntu Free Tier)

Applicable to Oracle Cloud Free Tier, AWS Free Tier, or Google Cloud Free Tier.

## Setup Instructions

1. **Install Node.js & pnpm**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pnpm
   ```
2. **Setup Code**:
   Clone repository, `pnpm install`, and `pnpm build`.
3. **Process Management**:
   Use `pm2` to keep the app running.
   ```bash
   sudo npm install -g pm2
   pm2 start "pnpm start" --name "thecueroom"
   ```
4. **Reverse Proxy**:
   Use Nginx to handle SSL and port 80/443 mapping to 5000.

## Common Failures
- **Firewall**: Ensure port 80/443 and 5000 are open in the VPS dashboard.
- **Permissions**: Run `pnpm install` as a non-root user.
