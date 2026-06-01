# ShieldTask | Secure Full-Stack DevSecOps Task Manager
### 🛡️ IPSR Solutions Redefining Excellence Ltd - Capstone Project

ShieldTask is an enterprise-grade, highly secure, full-stack Task Management application engineered specifically as a Capstone showcase for modern **DevSecOps** and **Cloud Infrastructure** best practices. 

The project prioritizes Visual Excellence with a cutting-edge **Dark Glassmorphic UI** (Vanilla CSS variables) and implements rigorous Cyber Security standards across both application layers and automated infrastructure.

---

## 🏗️ Capstone Architecture Blueprint

```
                     [ Internet Users ]
                             │
                             ▼  Route 53 Domain
                 [ Application Load Balancer ] (Port 80/443)
                             │
            ┌────────────────┴────────────────┐ (SSL/TLS - Private IP Forwarding)
            ▼                                 ▼
   [ Ubuntu App Server 1 ]           [ Ubuntu App Server 2 ] (Private Subnet)
   ├── Nginx Reverse Proxy           ├── Nginx Reverse Proxy
   └── Node.js Express API           └── Node.js Express API
         │                                 │
         ├─────────────────────────────────┤
         ▼                                 ▼
[ S3 Attachments Bucket ]       [ AWS RDS MySQL Instance ] (Private DB Subnet)
         │
         ▼ CloudFront
[ Amazon CloudFront CDN ]
```

---

## 📂 Project Structure

```
secure-task-manager/
├── backend/
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & Role-Based Access Control
│   │   └── security.js        # Input sanitization and security header enforcement
│   ├── routes/
│   │   ├── auth.js            # User Registration & Login (w/ bcrypt & rate limiting)
│   │   ├── tasks.js           # Tasks CRUD (parameterized queries)
│   │   └── admin.js           # Admin Dashboard data & user management
│   ├── database.js            # Database structure and schema setup (SQLite)
│   ├── server.js              # Express entrypoint with core security controls
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx      # Premium login view
│   │   │   ├── Register.jsx   # Premium registration view with password indicator
│   │   │   ├── Tasks.jsx      # Task Grid/List dashboard (CRUD)
│   │   │   └── Admin.jsx      # Exclusive dashboard for system metrics & users
│   │   ├── App.jsx            # Main app controller, routing & session holder
│   │   ├── index.css          # Stunning dark glassmorphic design system
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── infra/
│   └── main.tf                # Complete AWS VPC, Subnets, EC2, RDS, ALB, S3 Terraform
├── scripts/
│   ├── backup.sh              # Cron-compatible S3 DB & Media backup script
│   └── deploy.sh              # Ubuntu deployment: SSH hardening, Nginx setup, UFW
└── docker-compose.yml         # DevSecOps multi-container configuration
```

---

## 🛡️ Core DevSecOps & Security Implementations

ShieldTask is secured at every layer using industry-accepted DevSecOps patterns:

### 1. Cyber Security & Secure Coding
*   **Password Hashing**: Direct server-side hashing of credentials using `bcryptjs` (salt rounds: 10).
*   **JWT Stateless Authentication**: User tokens are dynamically signed (`jsonwebtoken`), validating user identities securely.
*   **SQL Injection (SQLi) Prevention**: 100% of SQLite inputs are managed via fully parameterized SQLite queries (`db.all("SELECT * FROM tasks WHERE user_id = ?", [id])`), rendering SQL Injection attacks impossible.
*   **Cross-Site Scripting (XSS) Mitigation**: All request payloads (`body`, `query`, `params`) pass through a recursive HTML escaping middleware (`backend/middleware/security.js`), stripping out potential `<script>` tags or raw HTML elements.
*   **API Brute-Force & Rate Limiting**: Limiters restrict IPs to a maximum of 20 authentication requests per 15-minute window (`express-rate-limit`).
*   **Strict Security Headers**: Integrates `helmet` and custom middlewares applying strict headers:
    *   `X-Frame-Options: DENY` (Anti-Clickjacking)
    *   `X-Content-Type-Options: nosniff` (Anti-MIME-sniffing)
    *   `Content-Security-Policy` (Restricts code injection vectors)
    *   `Strict-Transport-Security` (Forces HTTPS)

### 2. Monitoring & Logging
*   **Failed Logins Counter**: Tracking failed credential matches in a dedicated database and audit logs table.
*   **Live Audit Stream**: Interactive view in the Admin dashboard showing live operations (Regs, User roles, purging logs, etc.).
*   **AWS CloudWatch Ready**: Structured performance metrics endpoint (`/api/metrics`) exposes raw memory usage, CPU percentages, system uptime, and failed logins for AWS agent ingestion.

### 3. Linux & Networking Administration (`scripts/`)
*   **Firewall Hardening**: Automated script (`deploy.sh`) whitelists only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) on Ubuntu's `UFW` firewall.
*   **SSH Locking**: Automated sed rules disable root SSH login and completely disable password authentication in `/etc/ssh/sshd_config` (forcing secure SSH key authorization).
*   **Reverse Nginx Proxy**: Predefined Nginx block configures rate-limiting, handles client proxy header forwarding, and establishes dynamic static asset cache controls.
*   **Scheduled Backups**: Gzipped backup automation script (`backup.sh`) encapsulates databases and uploads and readies them for Amazon S3 storage via cron tasking.

### 4. Infrastructure as Code (`infra/main.tf`)
*   Includes modular **Terraform** scripts provisioning:
    *   1 Custom AWS VPC (`10.0.0.0/16`)
    *   6 subnets partitioned across 2 Availability Zones for high availability (2 Public Subnets, 2 Private App Subnets, 2 Private Database Subnets)
    *   Fully-configured Security Groups mapping private database port `3306` only to App Subnet instances, and private App port `80` only to the Application Load Balancer.
    *   RDS MySQL db instance, ALB Target groups, S3 Backup Bucket, and CloudFront CDN routing.

---

## 🚀 Quickstart Guides

### 🗝️ Pre-Seeded Default Profiles
The database seeds default profiles immediately on start for test purposes:
*   **Administrator Profile**: 
    *   Username: `admin`
    *   Password: `Password123!`
*   **Standard User Profile**:
    *   Username: `user`
    *   Password: `Password123!`

---

### Option A: Local Dev Launch (Recommended)

#### Prerequisites
*   Node.js version `v20` or higher
*   NPM version `v10` or higher

#### 1. Launch Backend API
```bash
cd backend
npm install
npm run dev
```
*Backend runs securely on `http://localhost:5000`*

#### 2. Launch Frontend SPA
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend hot-reloads on `http://localhost:5173`*

---

### Option B: Docker Container Orchestration

Run the complete multi-container setup immediately with Docker:

```bash
docker-compose up --build
```
* Frontend is served on port `80` (`http://localhost`) and communicates with the backend container on port `5000`!

---

### Option C: Cron Backup Scheduling

To schedule the automated backups on your Ubuntu EC2 Instance:
1. Copy the `scripts/backup.sh` script to `/usr/local/bin/shieldtask-backup.sh`.
2. Grant execution privileges:
   ```bash
   sudo chmod +x /usr/local/bin/shieldtask-backup.sh
   ```
3. Open the crontab editor:
   ```bash
   crontab -e
   ```
4. Schedule the backup daily at 2:00 AM:
   ```cron
   0 2 * * * /usr/local/bin/shieldtask-backup.sh >> /var/log/shieldtask-backup.log 2>&1
   ```
