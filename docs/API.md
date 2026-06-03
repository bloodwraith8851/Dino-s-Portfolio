# API Documentation

The portfolio utilizes Vercel Edge Functions located in the \`/api\` directory to provide secure, serverless backend operations.

## Authentication

### Admin Login
- **Path:** \`/api/auth/admin\`
- **Method:** \`POST\`
- **Description:** Authenticates an admin session and issues a JWT token.
- **Request Body:**
  ```json
  {
    "password": "your_password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "jwt_token_string"
  }
  ```
- **Error Responses:**
  - \`400 Bad Request\`: Missing password
  - \`401 Unauthorized\`: Invalid password
  - \`429 Too Many Requests\`: Brute force lockout triggered

## Analytics

### Track Event
- **Path:** \`/api/analytics/track\`
- **Method:** \`POST\`
- **Description:** Tracks page views and terminal commands in Neon DB.
- **Request Body:**
  ```json
  {
    "event_type": "page_view | command | interaction",
    "metadata": {
      "path": "/",
      "visitor_alias": "guest123"
    }
  }
  ```
- **Rate Limit:** 30 events per IP per minute.

### Server Statistics
- **Path:** \`/api/analytics/stats\`
- **Method:** \`GET\`
- **Description:** Fetches aggregate diagnostics across Neon DB and Upstash Redis.
- **Response (200 OK):**
  ```json
  {
    "totalViews": 14502,
    "cacheSize": 42,
    "uptime": 120534
  }
  ```

## Notifications & Webhooks

### Send Notification
- **Path:** \`/api/notifications/send\`
- **Method:** \`POST\`
- **Description:** Dispatches a notification event to Inngest for background processing (e.g., sending emails via Resend).
- **Request Body:**
  ```json
  {
    "type": "hire",
    "name": "John Doe",
    "email": "john@example.com",
    "msg": "I'd like to hire you."
  }
  ```

### Inngest Handler
- **Path:** \`/api/webhooks/inngest\`
- **Method:** \`POST\`, \`PUT\`, \`GET\`
- **Description:** Primary webhook endpoint for the Inngest executor to trigger background functions.
- **Auth Required:** Implicitly secured via \`INNGEST_SIGNING_KEY\`.

## Projects & Interactions

### Like Project
- **Path:** \`/api/projects/like\`
- **Method:** \`POST\`
- **Description:** Increments the like count for a specific project.
- **Request Body:**
  ```json
  {
    "projectId": "uuid-string"
  }
  ```
- **Rate Limit:** 5 likes per IP per hour.

### List Projects
- **Path:** \`/api/projects/list\`
- **Method:** \`GET\`
- **Description:** Fetches all projects with their aggregate like counts. Responses are cached via Redis for 60 seconds.
