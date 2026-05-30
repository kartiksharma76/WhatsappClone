# 💬 WhatsApp Clone – Full-Stack Chat Application

A **production-grade**, real-time chat application built with **Spring Boot**, **React**, **MySQL**, and **WebSocket/STOMP**.

---

## 📦 Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Backend      | Java 17, Spring Boot 3.2, Spring Security       |
| Real-time    | WebSocket + STOMP via SockJS                    |
| Database     | MySQL 8.0 + Spring Data JPA (Hibernate)         |
| Auth         | JWT (access + refresh tokens)                   |
| Frontend     | React 18, Vite, TailwindCSS, Zustand            |
| API Docs     | SpringDoc OpenAPI 3 / Swagger UI                |
| Containerize | Docker + Docker Compose                         |
| Testing      | JUnit 5, Mockito, Spring Boot Test              |

---

## ✨ Features

### Messaging
- ✅ One-to-one private chats
- ✅ Group chats with admin controls
- ✅ Real-time delivery via WebSocket/STOMP
- ✅ Message delivery status: **Sent → Delivered → Seen** (tick marks)
- ✅ Reply to messages (threaded replies)
- ✅ Edit and delete messages (soft-delete)
- ✅ Emoji reactions on messages
- ✅ Image, file, and document sharing
- ✅ Voice note recording and playback
- ✅ Infinite scroll with pagination
- ✅ Message search within chats

### Users & Auth
- ✅ JWT authentication (access + refresh tokens)
- ✅ BCrypt password hashing
- ✅ Role-based access control (USER / ADMIN)
- ✅ Profile management (name, bio, avatar)
- ✅ Online/offline/away status
- ✅ Last seen timestamp
- ✅ Block/unblock users
- ✅ Account deactivation

### Chat Management
- ✅ Pin/unpin chats
- ✅ Archive/unarchive chats
- ✅ Mute notifications per chat
- ✅ Unread message count badges
- ✅ Typing indicators (real-time)
- ✅ User presence broadcasts
- ✅ Group icon, name, description
- ✅ Add/remove group participants
- ✅ Promote/demote group admins
- ✅ Leave group

### UI/UX
- ✅ WhatsApp-inspired design
- ✅ Dark / Light mode toggle
- ✅ Responsive (desktop + mobile)
- ✅ Emoji picker
- ✅ Chat wallpaper pattern
- ✅ Toast notifications
- ✅ Animated typing dots
- ✅ Message bubble tails

---

## 🗂️ Project Structure

```
whatsapp-clone/
├── backend/                      # Spring Boot application
│   ├── src/main/java/com/chatapp/
│   │   ├── ChatApplication.java  # Entry point
│   │   ├── config/               # Security, WebSocket, OpenAPI, App configs
│   │   ├── controller/           # REST API endpoints
│   │   ├── dto/                  # Request/Response DTOs
│   │   │   ├── request/          # AuthRequest, ChatRequest
│   │   │   └── response/         # ApiResponse, ChatResponse, MessageResponse, UserResponse
│   │   ├── entity/               # JPA entities (User, Chat, Message, etc.)
│   │   ├── exception/            # Custom exceptions + GlobalExceptionHandler
│   │   ├── repository/           # Spring Data JPA repositories
│   │   ├── security/             # JWT filter, UserDetailsService, JwtUtil
│   │   ├── service/              # Business logic interfaces
│   │   │   └── impl/             # Service implementations
│   │   └── websocket/            # STOMP controller, event payloads
│   └── src/test/                 # JUnit + Mockito tests
│
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/             # ChatWindow, Sidebar, MessageBubble, MessageInput…
│   │   │   └── modals/           # NewChatModal, NewGroupModal, ProfileModal
│   │   ├── pages/                # LoginPage, RegisterPage, ChatPage
│   │   ├── services/             # api.js (Axios), websocket.js (STOMP)
│   │   ├── store/                # Zustand stores (auth, chat, UI)
│   │   └── styles/               # Global CSS (TailwindCSS)
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker/
│   └── docker-compose.yml
│
└── docs/
    ├── schema.sql                # Full DB schema
    └── sample-data.sql           # Dev seed data
```

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 20+
- MySQL 8.0+
- Maven 3.9+
- Docker & Docker Compose (optional)

---

### Option A – Docker Compose (Recommended)

```bash
# Clone the project
git clone https://github.com/your-org/whatsapp-clone.git
cd whatsapp-clone

# Start all services (MySQL + Backend + Frontend)
docker compose -f docker/docker-compose.yml up --build

# Access the app
open http://localhost:3000

# Swagger API docs
open http://localhost:8080/api/swagger-ui.html
```

---

### Option B – Manual Setup

#### 1. Database

```sql
CREATE DATABASE chatapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatuser'@'localhost' IDENTIFIED BY 'chatpassword';
GRANT ALL PRIVILEGES ON chatapp.* TO 'chatuser'@'localhost';
FLUSH PRIVILEGES;

-- Optional: load sample data
mysql -u chatuser -p chatapp < docs/schema.sql
mysql -u chatuser -p chatapp < docs/sample-data.sql
```

#### 2. Backend

```bash
cd backend

# Copy and edit environment config
cp src/main/resources/application.yml src/main/resources/application-local.yml
# Edit DB credentials, JWT secret, mail settings

# Run
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Or build & run jar
mvn clean package -DskipTests
java -jar target/whatsapp-clone-1.0.0.jar
```

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8080/api" > .env.local
echo "VITE_WS_URL=http://localhost:8080/api/ws" >> .env.local

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🔐 Authentication Flow

```
Client                    Server
  │                          │
  ├──── POST /auth/register ──►  Validate → BCrypt password → Save user
  │◄─── 201 { accessToken, refreshToken, user } ─────────────────────────
  │                          │
  ├──── POST /auth/login ────►  Authenticate → Generate JWT tokens
  │◄─── 200 { accessToken (24h), refreshToken (7d) } ────────────────────
  │                          │
  ├──── GET /users/me ───────►  JWT filter validates token → Returns user
  │  Authorization: Bearer <token>
  │◄─── 200 { user data } ───────────────────────────────────────────────
  │                          │
  ├──── POST /auth/refresh ──►  Validate refresh token → New access token
  │◄─── 200 { newAccessToken } ──────────────────────────────────────────
```

---

## 📡 WebSocket Events

Connect to: `ws://localhost:8080/api/ws` (SockJS)

**STOMP CONNECT headers:**
```
Authorization: Bearer <accessToken>
```

### Subscriptions

| Destination                   | Description                        |
|-------------------------------|------------------------------------|
| `/topic/chat/{chatId}`        | Incoming messages for a chat room  |
| `/topic/typing/{chatId}`      | Typing indicator events            |
| `/topic/delivery/{chatId}`    | Message delivery/seen updates      |
| `/topic/presence`             | User online/offline broadcasts     |
| `/user/queue/errors`          | Private error messages             |

### Client Publishes (to `/app/...`)

| Destination        | Payload                                           |
|--------------------|---------------------------------------------------|
| `/app/typing`      | `{ chatId, userId, userName, typing: bool }`      |
| `/app/presence`    | `{ userId, status: "ONLINE" \| "OFFLINE" }`       |
| `/app/delivered`   | `{ messageId, chatId, userId }`                   |
| `/app/seen`        | `{ messageId, chatId, userId }`                   |

---

## 📋 REST API Reference

**Base URL:** `http://localhost:8080/api`

Full interactive docs at: `/swagger-ui.html`

### Auth Endpoints

| Method | Path                      | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/auth/register`          | Register new user        |
| POST   | `/auth/login`             | Login and get tokens     |
| POST   | `/auth/refresh`           | Refresh access token     |
| POST   | `/auth/logout`            | Logout (set offline)     |
| PUT    | `/auth/change-password`   | Change password          |

### User Endpoints

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/users/me`                   | Get current user         |
| PUT    | `/users/me`                   | Update profile           |
| PUT    | `/users/me/picture`           | Upload profile picture   |
| GET    | `/users/search?q=`            | Search users             |
| GET    | `/users/{id}`                 | Get user by ID           |
| POST   | `/users/block/{id}`           | Block a user             |
| DELETE | `/users/block/{id}`           | Unblock a user           |

### Chat Endpoints

| Method | Path                                  | Description                     |
|--------|---------------------------------------|---------------------------------|
| POST   | `/chats/private`                      | Create/get private chat         |
| POST   | `/chats/group`                        | Create group chat               |
| GET    | `/chats`                              | Get all user chats (paginated)  |
| GET    | `/chats/{id}`                         | Get chat details                |
| GET    | `/chats/search?q=`                    | Search chats                    |
| PUT    | `/chats/{id}/group`                   | Update group info               |
| POST   | `/chats/{id}/participants`            | Add participants                |
| DELETE | `/chats/{id}/participants/{userId}`   | Remove participant              |
| POST   | `/chats/{id}/admins/{userId}`         | Make admin                      |
| DELETE | `/chats/{id}/admins/{userId}`         | Remove admin                    |
| POST   | `/chats/{id}/leave`                   | Leave group                     |
| DELETE | `/chats/{id}`                         | Delete chat                     |
| PUT    | `/chats/{id}/pin?pinned=true`         | Pin/unpin chat                  |
| PUT    | `/chats/{id}/archive?archived=true`   | Archive chat                    |
| PUT    | `/chats/{id}/mute?muted=true`         | Mute chat                       |

### Message Endpoints

| Method | Path                              | Description                     |
|--------|-----------------------------------|---------------------------------|
| POST   | `/messages`                       | Send text message               |
| POST   | `/messages/file`                  | Send file/image/voice           |
| GET    | `/messages/chat/{chatId}`         | Get messages (paginated)        |
| GET    | `/messages/chat/{chatId}/search`  | Search messages                 |
| PUT    | `/messages/edit`                  | Edit message                    |
| DELETE | `/messages/{id}`                  | Delete message                  |
| POST   | `/messages/react`                 | React to message                |
| DELETE | `/messages/{id}/react`            | Remove reaction                 |
| POST   | `/messages/chat/{chatId}/seen`    | Mark all messages as seen       |

---

## 🧪 Running Tests

```bash
cd backend

# All tests
mvn test

# Specific test class
mvn test -Dtest=AuthServiceTest

# Integration tests only
mvn test -Dtest="*IntegrationTest"

# Coverage report
mvn test jacoco:report
open target/site/jacoco/index.html
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  Zustand (state) │ Axios (REST) │ STOMP (WS) │
└────────────────────┬────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────┐
│           Spring Boot Backend                │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐   │
│  │Controller│ │ Service  │ │ Repository │   │
│  └────┬─────┘ └────┬─────┘ └─────┬──────┘   │
│       │            │             │           │
│  ┌────▼─────────────▼─────────────▼──────┐  │
│  │        Spring Security (JWT)           │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │   WebSocket / STOMP Message Broker     │  │
│  └───────────────────────────────────────┘  │
└────────────────────┬────────────────────────┘
                     │ JDBC
┌────────────────────▼────────────────────────┐
│                  MySQL 8.0                   │
│  users │ chats │ messages │ notifications    │
└─────────────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

- JWT signed with HMAC-SHA256
- Refresh token rotation
- BCrypt password hashing (strength 10)
- CORS configured for known origins only
- Stateless session (no server-side sessions)
- Method-level `@PreAuthorize` for admin endpoints
- User blocking enforcement at service layer
- Soft-delete for messages (privacy)
- File type and size validation on upload

---

## 🌍 Environment Variables

| Variable                  | Default                       | Description              |
|---------------------------|-------------------------------|--------------------------|
| `DB_HOST`                 | `localhost`                   | MySQL host               |
| `DB_PORT`                 | `3306`                        | MySQL port               |
| `DB_NAME`                 | `chatapp`                     | Database name            |
| `DB_USERNAME`             | `root`                        | Database user            |
| `DB_PASSWORD`             | `root`                        | Database password        |
| `JWT_SECRET`              | *(long hex string)*           | JWT signing secret       |
| `JWT_EXPIRATION`          | `86400000`                    | Access token TTL (ms)    |
| `JWT_REFRESH_EXPIRATION`  | `604800000`                   | Refresh token TTL (ms)   |
| `FILE_UPLOAD_DIR`         | `./uploads`                   | File storage path        |
| `SERVER_PORT`             | `8080`                        | Backend port             |
| `ALLOWED_ORIGINS`         | `http://localhost:3000`       | CORS allowed origins     |

---

## 📈 Scaling Considerations

- Replace in-memory STOMP broker with **RabbitMQ** or **Redis pub/sub** for multi-instance deployment
- Move file storage to **AWS S3** or **GCP Cloud Storage**
- Add **Redis** for JWT blacklist and session caching
- Add **Elasticsearch** for full-text message search
- Use **CDN** for serving media files

---

## 📄 License

MIT License – free to use for learning and commercial projects.

---

## 👨‍💻 Sample Login Credentials

After running sample-data.sql:

| Email                | Password      | Role  |
|----------------------|---------------|-------|
| alice@chatapp.com    | password123   | USER  |
| bob@chatapp.com      | password123   | USER  |
| carol@chatapp.com    | password123   | USER  |
| admin@chatapp.com    | password123   | ADMIN |
