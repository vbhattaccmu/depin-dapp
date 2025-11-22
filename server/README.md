# BigWater DePIN Backend API

This directory contains the backend server for persisting wallet and user data.

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns: `{ status: 'ok' }`

### Wallet Endpoints

#### Store Wallet
- **POST** `/api/wallets`
- Body:
  ```json
  {
    "address": "0x...",
    "encryptedKey": "...",
    "iv": "...",
    "passwordHash": "...",
    "email": "user@example.com",
    "username": "username",
    "createdAt": 1234567890
  }
  ```
- Returns: `{ success: true, address: "0x..." }`

#### Get Wallet
- **GET** `/api/wallets/:address`
- Returns:
  ```json
  {
    "address": "0x...",
    "encryptedKey": "...",
    "iv": "...",
    "passwordHash": "...",
    "email": "user@example.com",
    "username": "username",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
  ```

#### Update Wallet
- **PATCH** `/api/wallets/:address`
- Body: Partial wallet data
- Returns: Updated wallet object

### User Credentials Endpoints

#### Store User Credentials
- **POST** `/api/users/credentials`
- Body:
  ```json
  {
    "identifier": "username or email",
    "type": "username or email",
    "address": "0x...",
    "createdAt": 1234567890
  }
  ```
- Returns: `{ success: true }`

#### Get Wallet Address by Identifier
- **GET** `/api/users/credentials/:identifier`
- Returns:
  ```json
  {
    "identifier": "username or email",
    "type": "username or email",
    "address": "0x...",
    "createdAt": 1234567890
  }
  ```

## Example Server Implementation

See `server.js` for a basic Express.js implementation using Redis.

## Environment Variables

```bash
PORT=4000
REDIS_URL=redis://localhost:6379
API_SECRET=your-secret-key-here
```

### Redis Connection Options

- **Local Redis**: `redis://localhost:6379`
- **Redis with password**: `redis://:password@localhost:6379`
- **Redis Cloud**: `redis://default:password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345`
- **Redis with TLS**: `rediss://:password@host:port` (note the `rediss://` protocol)

## Security Notes

- **Never store plaintext private keys on the server**
- Use encryption at rest for sensitive data
- Implement rate limiting
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement authentication/authorization for API access

