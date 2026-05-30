# ARK Server Commander

> ⚠️ **Development Stage Notice**: This project is currently in development stage and features may be incomplete or have stability issues. It is recommended for testing environments only and should not be used in production.

[English](README.md) | [中文](README-zh.md)

- ARK Survival Evolved server management tool for Linux.
- ARK servers come with ArkApi plugin system built-in.

## 🎮 Features

### ✅ Implemented Features
- 🐳 Each ARK server runs in an independent Docker container
- 🔌 Servers come with ArkApi pre-installed
- 🔄 Server containers support automatic restart on crash
- ⬆️ Automatic server files and mod updates on first startup
- 💾 Automatic creation and management of Docker volumes for game data storage
- 🖥️ Add and manage multiple ARK servers
- ⚙️ Configure server settings and configuration parameters (GameUserSettings.ini, Game.ini, startup arguments)
- ▶️ One-click server start/stop/restart
- 🖼️ Docker image management (pull, update, status check)
- 🔐 JWT authentication and user management
- 📝 Complete API documentation (Swagger)
- 🧩 **Plugin Manager** — file browser with drag-and-drop upload, rename, delete, mkdir
- 📝 **JSON/INI/Config Editor** — inline modal editor for `.json`, `.ini`, `.txt`, `.cfg`, `.yaml`, `.xml`, `.conf` files
- 📦 **Zip/Unzip** — auto-extract on upload, manual extract, download folders as ZIP
- 📋 **Export/Import Config** — export/import all configs (GameUserSettings.ini + Game.ini + server_args) as a single JSON file; individual download/import per tab
- 🌐 **i18n** — English and Chinese (zh) translations

### 🚧 Planned Features
- 🎮 RCON command execution
- 📊 Server running status monitoring
- 🎨 Mod management integration with Steam Workshop
- 📋 Server log viewing
- 💾 Server save and configuration backup
- 🔍 Tool version update checking
- ⚡ Optional server files and mod updates
- 🔄 Container image update functionality
- 🔌 MCP (Mod Configuration Protocol) support

### 🚀 Future Plans
- ☸️ Multi-host management based on K8S
- 🌍 Server listing website, breaking free from poor Steam server search
- 👥 Player user interface

## 🔒 Security Notice

### ⚠️ JWT Secret Configuration (CRITICAL)

**Before deploying this application, you MUST configure a strong JWT secret key!**

#### Why is this important?
- JWT (JSON Web Token) is used for user authentication and session management
- A weak or default JWT secret allows attackers to forge authentication tokens
- This could lead to **complete system compromise** and unauthorized access to all servers

#### How to configure:

**1. Generate a strong random secret (recommended):**
```bash
openssl rand -base64 48
```

**2. Set the environment variable:**

For Docker Compose deployment, edit `docker-compose.yml`:
```yaml
environment:
  - JWT_SECRET=your-generated-secret-here  # Replace with generated secret
```

For direct deployment:
```bash
export JWT_SECRET='your-generated-secret-here'
```

#### Security Requirements:
- ✅ Minimum length: 32 characters
- ✅ Use cryptographically random generation
- ✅ Never commit secrets to version control
- ✅ Use different secrets for different environments (dev/staging/prod)
- ❌ Never use default values like "your-secret-key-here"
- ❌ Never use common passwords or dictionary words

#### Validation:
The application will **refuse to start** if:
- JWT_SECRET is not set
- JWT_SECRET is shorter than 32 characters
- JWT_SECRET contains weak/common password patterns

---

## 🚀 Quick Start

### 🔧 System Requirements

- 8GB+ memory per ARK server (recommended)
- 10GB+ disk space per ARK server

### 🔧 Local Development (Docker)

Build the custom image with both Go backend and Next.js frontend:
```bash
git clone https://github.com/21oramaster/ark-commander.git
cd ark-commander
docker build -t ark-commander-fixed:latest .
docker compose up -d
```

Access the interface at `http://<your-ip>:3000`. Default login: `admin` / `admin123`.

### 🐳 Docker Containerized Deployment

Copy the docker-compose.yml, or use the following configuration directly:
```yml
version: '3.8'

services:
  ark-commander:
    image: tbro98/arkservercommander:latest
    container_name: ark-commander
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=your-secret-key-here
      - DB_PATH=/data/ark_server.db
      - SERVER_PORT=8080
    volumes:
      - ./data:/data
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    privileged: true
```

```bash
sudo docker compose up -d
```

## 📖 User Guide

### 🆕 First Time Use
1. The system will automatically redirect to the initialization page
2. Set up your administrator account and password
3. After initialization, log into the system

### 🖥️ Managing Servers
1. After logging in, click "Server Management"
2. Click "Add Server" to create a new server configuration
3. Click the pencil icon to edit a server — configure Basic Parameters, GameUserSettings.ini, Game.ini, and Startup Arguments across 4 tabs

### 🧩 Plugin Manager
1. Navigate to "Plugins" in the sidebar
2. Select a server, then browse, upload, edit, rename, delete, or download plugin files
3. ZIP files are auto-extracted on upload; use the extract button for existing ZIPs
4. Use the "Download as ZIP" button to download folders

### 📋 Export/Import Config
1. Open a server's edit page
2. Use "Export All Config" to download all settings as JSON
3. Use "Import All Config" to restore from a previously exported JSON
4. Individual tabs have their own Download/Import buttons for single-file operations

### 🗺️ Supported Maps
- The Island, The Center, Scorched Earth, Aberration, Extinction
- Valguero, Genesis, Genesis 2, Crystal Isles, Lost Island, Fjordur

## ❓ FAQ

### ❓ Q: How to backup ARK server data?
A: Server data is stored in Docker volumes `ark-server-<server_number>`. You can backup manually or use the Export Config feature for settings.

### ❓ Q: How to view ARK server logs?
A: Currently logs need to be viewed inside the container. Log viewing is planned for a future update.

### ❓ Q: How to update ARK server images?
A: Go to the Home page and click "Check Updates" on any server card. The system will compare local vs remote image digests and prompt for update.

### ❓ Q: What if JWT_SECRET configuration fails?
A: If the application fails to start with JWT_SECRET errors, ensure:
- JWT_SECRET is set in environment variables
- Secret is at least 32 characters long
- Use `openssl rand -base64 48` to generate a strong random secret

### 🖼️ ARK Server Image
- This system uses the `tbro98/ase-server:latest` image to run ARK servers
- Image source: [ASE-Server-Docker](https://github.com/tbro199803/ASE-Server-Docker)

## 📸 Interface Screenshots
![](./docs/zh/images/img_servers.png)
![](./docs/zh/images/ima_base.png)
![](./docs/zh/images/img_GameUserSettings.png)
![](./docs/zh/images/img_GameIni.png)
![](./docs/zh/images/img_args.png) 
