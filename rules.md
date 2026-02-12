# Codebase Standards & Conventions

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [File & Folder Structure](#file--folder-structure)
4. [Naming Conventions](#naming-conventions)
5. [API Development Standards](#api-development-standards)
6. [Component Development Standards](#component-development-standards)
7. [Database & Models](#database--models)
8. [Authentication & Authorization](#authentication--authorization)
9. [Common Libraries & Utilities](#common-libraries--utilities)
10. [Code Patterns](#code-patterns)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)

**Key Characteristics:**
- Serverless architecture optimized for Vercel
- MongoDB with cached connections (prevents exhaustion)
- Feature-based component organization
- RESTful API design with Next.js API routes
- React hooks for state management

---

## Architecture & Tech Stack

### Core Framework
- **Next.js 14**: React framework with server-side rendering and API routes
- **React 18**: UI library with hooks
- **Node.js >= 18**: Runtime environment

### Database & ORM
- **MongoDB**: NoSQL database
- **Mongoose 8**: ODM for MongoDB with schema validation

### Authentication & APIs
- **Google OAuth 2.0**: User authentication
- **Gmail API**: Email sending and tracking
- **google-auth-library**: OAuth client library
- **googleapis**: Google API integration

### Cloud & Storage
- **Vercel**: Deployment platform
- **Azure Blob Storage**: File storage

### UI & Styling
- **React-Bootstrap 2**: Component library
- **Bootstrap 5**: CSS framework
- **styled-components**: CSS-in-JS
- **Framer Motion**: Animation library
- **React Icons**: Icon library

### Utilities
- **axios**: HTTP client
- **papaparse & csv-parser**: CSV parsing
- **formidable**: File upload handling
- **dotenv**: Environment variable management

### Analytics
- **Vercel Analytics**: Built-in analytics
- **Amplitude** (if configured): Event tracking

---

## File & Folder Structure

```
root/
├── pages/                    # Next.js pages and API routes
│   ├── api/                 # API endpoints (serverless functions)
│   │   ├── auth/           # Authentication endpoints
│   │   ├── campaign/       # Campaign-related endpoints
│   │   ├── user/           # User-related endpoints
│   │   └── *.js            # Other API endpoints
│   ├── _app.js             # Custom App component
│   └── *.js                # Page components
├── components/              # Reusable React components
│   ├── activation/         # Activation flow components
│   ├── campaigns/          # Campaign management components
│   ├── dashboard/          # Dashboard components
│   ├── mascot/             # Mascot UI components
│   └── *.js                # Shared components
├── models/                  # MongoDB schemas
│   └── EmailEvent.js       # All data models (User, Campaign, etc.)
├── hooks/                   # Custom React hooks
├── public/                  # Static assets (images, fonts, etc.)
├── script/                  # Utility scripts
├── mongodb.js              # Database connection handler
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment config
└── .gitignore              # Git ignore rules
```

### Directory Organization Rules

1. **pages/**: Next.js automatically routes files in this directory
   - File-based routing: `pages/about.js` → `/about`
   - API routes: `pages/api/campaigns.js` → `/api/campaigns`
   - Dynamic routes: `pages/api/campaign/[id].js` → `/api/campaign/:id`

2. **components/**: Organized by feature or domain
   - Group related components in subdirectories
   - Use `index.js` for main component exports (optional)
   - Keep shared components at root level

3. **models/**: All Mongoose schemas in a single file
   - Centralized schema definitions
   - Exports all models from one file

4. **hooks/**: Custom React hooks for reusable logic

---

## Naming Conventions

### Files

| Type | Convention | Examples |
|------|-----------|----------|
| **Pages** | kebab-case | `activation.js`, `template4.js` |
| **API Routes** | kebab-case | `send-email.js`, `campaign-template-save.js` |
| **Components** | PascalCase | `CampaignCard.js`, `EmailDashboard.js` |
| **Models** | PascalCase | `EmailEvent.js` |
| **Utilities** | camelCase or kebab-case | `mongodb.js`, `script` |

### Code Elements

| Element | Convention | Examples |
|---------|-----------|----------|
| **Variables** | camelCase | `isDropdownOpen`, `filteredRecipients`, `userId` |
| **Functions** | camelCase | `fetchCampaigns`, `handleCheck`, `createCampaign` |
| **Components** | PascalCase | `CampaignCard`, `EmailDashboard`, `Navbar` |
| **Hooks** | camelCase with `use` prefix | `useCampaigns`, `useEvents`, `useState` |
| **Constants** | UPPER_SNAKE_CASE | `MONGODB_URI`, `API_ENDPOINT` |
| **React Props** | camelCase | `campaign`, `metrics`, `onDelete` |
| **Database Fields** | camelCase | `createdAt`, `userId`, `refreshToken` |

### URL/Route Naming

- **API endpoints**: kebab-case with clear resource names
  - `/api/campaigns` (plural for collections)
  - `/api/campaign/[id]` (singular for single resource)
  - `/api/sync-email-events`
  - `/api/auth/google/callback`

---

## API Development Standards

### File Structure

API routes live in `pages/api/` and follow Next.js conventions:

```
pages/api/
├── campaigns.js              # /api/campaigns
├── events.js                 # /api/events
├── auth/
│   ├── login.js             # /api/auth/login
│   └── google/
│       └── callback.js      # /api/auth/google/callback
└── campaign/
    └── [id].js              # /api/campaign/:id (dynamic)
```

### Standard API Handler Pattern

**Every API route must follow this pattern:**

```javascript
import { connectToDatabase } from '../../mongodb';
import { User, Campaign, EmailEvent } from '../../models/EmailEvent';

export default async function handler(req, res) {
  // 1. Method validation (optional but recommended)
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Connect to database
    await connectToDatabase();

    // 3. Handle different HTTP methods
    if (req.method === 'GET') {
      // GET logic here
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const data = await Campaign.find({ user: userId })
        .sort({ createdAt: -1 });
      
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // POST logic here
      const { userId, name, description } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      const newRecord = await Campaign.create({
        user: userId,
        name,
        description,
      });

      return res.status(201).json(newRecord);
    }

    if (req.method === 'PUT') {
      // PUT logic here
      const { id } = req.query;
      const updates = req.body;

      const updated = await Campaign.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      // DELETE logic here
      const { id } = req.query;

      await Campaign.findByIdAndDelete(id);
      
      return res.status(200).json({ message: 'Deleted successfully' });
    }

  } catch (error) {
    // 4. Error handling
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### API Response Standards

**Success Responses:**
```javascript
// GET - Return data array or object
res.status(200).json(data);

// POST - Return created resource
res.status(201).json(newResource);

// PUT - Return updated resource
res.status(200).json(updatedResource);

// DELETE - Return success message
res.status(200).json({ message: 'Deleted successfully' });
```

**Error Responses:**
```javascript
// Client errors (400-499)
res.status(400).json({ error: 'Bad request message' });
res.status(401).json({ error: 'Unauthorized' });
res.status(403).json({ error: 'Forbidden' });
res.status(404).json({ error: 'Not found' });
res.status(405).json({ error: 'Method not allowed' });

// Server errors (500-599)
res.status(500).json({ error: 'Internal server error' });
```

### Request Parameter Access

```javascript
// URL query parameters: /api/campaigns?userId=123
const { userId } = req.query;

// Request body (POST/PUT): JSON payload
const { name, description } = req.body;

// Dynamic route parameters: /api/campaign/[id]
const { id } = req.query;

// Multiple parameters: /api/link/[emailID]?userId=123
const { emailID } = req.query;  // From URL path
const { userId } = req.query;   // From query string
```

### Database Connection Pattern

**Always use the cached connection:**

```javascript
import { connectToDatabase } from '../../mongodb';

// Inside handler
await connectToDatabase();  // Returns cached connection
```

**Never create new connections directly** - this will exhaust connection pools in serverless environments.

---

## Component Development Standards

### Standard Component Pattern

```javascript
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const ComponentName = ({ prop1, prop2, onAction }) => {
  // 1. Hooks declarations (useState, useRouter, etc.)
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef(null);

  // 2. useEffect hooks for side effects
  useEffect(() => {
    // Fetch data, setup listeners, etc.
    fetchData();
  }, [dependency]);

  // 3. Event handlers and helper functions
  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/endpoint', { data });
      // Handle response
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Render logic
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### Props Pattern

**Destructure props in function signature:**

```javascript
// ✅ Good
const CampaignCard = ({ campaign, metrics, onDelete, user }) => {
  // Use campaign, metrics, etc. directly
};

// ❌ Avoid
const CampaignCard = (props) => {
  const campaign = props.campaign;
  // ...
};
```

### State Management

**Use useState for component state:**

```javascript
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [recipients, setRecipients] = useState([]);
const [checkedRecipients, setCheckedRecipients] = useState({});
```

**Use useEffect for side effects:**

```javascript
useEffect(() => {
  // Fetch data when component mounts or dependencies change
  fetchData();
}, [dependency]);
```

### Event Handlers

**Name handlers with `handle` prefix:**

```javascript
const handleClick = () => { /* ... */ };
const handleSubmit = async (e) => { /* ... */ };
const handleChange = (e) => { /* ... */ };
const handleTemplateClick = async (templateId) => { /* ... */ };
```

### Component Organization in Files

```javascript
// 1. Imports
import React, { useState } from 'react';
import axios from 'axios';

// 2. Styled components (if using styled-components)
const StyledButton = styled.button`
  /* styles */
`;

// 3. Component definition
const MyComponent = ({ props }) => {
  // Component logic
};

// 4. Export
export default MyComponent;
```

### Component File Structure Examples

**Simple component:**
```
components/
└── Navbar.js
```

**Complex component with sub-components:**
```
components/
└── campaigns/
    ├── index.js           # Main export
    ├── CampaignCard.js
    ├── EmptyState.js
    └── CreateCampaignCard.js
```

---

## Database & Models

### Model Definition Pattern

**All models are defined in `models/EmailEvent.js`:**

```javascript
import mongoose from 'mongoose';

// 1. Define schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  activated: { type: Boolean, required: true },
  credit: { type: Number, default: 300 },
  template: { type: [String] },
  // ... more fields
});

// 2. Create model with fallback to prevent recompilation
const User = mongoose.models?.User || mongoose.model('User', UserSchema);

// 3. Export all models
export { User, Auth, Campaign, EmailEvent, Email };
```

### Schema Field Patterns

**Field definition syntax:**

```javascript
const Schema = new mongoose.Schema({
  // Required string
  name: { type: String, required: true },
  
  // Required with unique constraint
  email: { type: String, required: true, unique: true },
  
  // Optional string
  description: { type: String },
  
  // Number with default
  credit: { type: Number, default: 300 },
  
  // Boolean with default
  activated: { type: Boolean, default: false },
  
  // Date with default to now
  createdAt: { type: Date, default: Date.now },
  
  // Array of strings
  template: { type: [String] },
  
  // Reference to another model (ObjectId)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Enum values
  state: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
});
```

### Common Model Patterns

**User Model:**
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  activated: { type: Boolean, required: true },
  credit: { type: Number, default: 300 },
});

const User = mongoose.models?.User || mongoose.model('User', UserSchema);
```

**Auth/Token Model:**
```javascript
const AuthSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true },
  accessToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const Auth = mongoose.models?.Auth || mongoose.model('Auth', AuthSchema);
```

**Campaign Model:**
```javascript
const CampaignSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  template: { type: String },
  createdAt: { type: Date, default: Date.now },
  rows: { type: Number, default: 0 },
  step: { type: Number, default: 0 },
  state: { type: String, default: 'pending' },
});

const Campaign = mongoose.models?.Campaign || mongoose.model('Campaign', CampaignSchema);
```

### Database Query Patterns

**Find all:**
```javascript
const campaigns = await Campaign.find({ user: userId })
  .sort({ createdAt: -1 });
```

**Find by ID:**
```javascript
const user = await User.findById(userId);
```

**Create:**
```javascript
const newCampaign = await Campaign.create({
  user: userId,
  name: 'Campaign Name',
  description: 'Description',
});
```

**Update:**
```javascript
const updated = await Campaign.findByIdAndUpdate(
  campaignId,
  { name: 'New Name', description: 'New Description' },
  { new: true }  // Return updated document
);
```

**Delete:**
```javascript
await Campaign.findByIdAndDelete(campaignId);

// Or delete many
await EmailEvent.deleteMany({ campaign: campaignId });
```

**Populate references:**
```javascript
const campaign = await Campaign.findById(id)
  .populate('user', 'name email');
```

### Database Connection (mongodb.js)

**Critical pattern for serverless environments:**

```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Global cache to prevent connection exhaustion
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log('Successfully connected to MongoDB.');
        return mongoose;
      })
      .catch(error => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
```

**Why this pattern?**
- Serverless functions create new instances for each request
- Without caching, each request would create a new DB connection
- Connection pools would be exhausted quickly
- This pattern reuses connections across requests

---

## Authentication & Authorization

### OAuth Flow Pattern

**1. Initiate OAuth (`/api/auth/google.js`):**
```javascript
export default async function handler(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    state: userId,  // Pass user ID for callback
  });

  res.redirect(authUrl);
}
```

**2. Handle OAuth callback (`/api/auth/google/callback.js`):**
```javascript
export default async function handler(req, res) {
  const { code, state } = req.query;
  const userId = state;

  try {
    await connectToDatabase();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in database
    await Auth.create({
      user: userId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: new Date(tokens.expiry_date),
    });

    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

### Token Storage Pattern

**Store tokens in Auth model:**
```javascript
const AuthSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true },
  accessToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
```

### User Identification Pattern

**Pass userId in requests:**

```javascript
// Query parameter
const { userId } = req.query;

// Request body
const { userId } = req.body;

// Verify user exists
const user = await User.findById(userId);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

---

## Common Libraries & Utilities

### HTTP Requests (axios)

```javascript
import axios from 'axios';

// GET request
const response = await axios.get('/api/campaigns?userId=123');
const data = response.data;

// POST request
const response = await axios.post('/api/campaigns', {
  userId: '123',
  name: 'Campaign Name',
});

// PUT request
const response = await axios.put('/api/campaign/123', {
  name: 'Updated Name',
});

// DELETE request
await axios.delete('/api/campaign/123');
```

### Router (Next.js)

```javascript
import { useRouter } from 'next/router';

const MyComponent = () => {
  const router = useRouter();
  
  // Navigate programmatically
  router.push('/dashboard');
  
  // Get query parameters
  const { id } = router.query;
  
  // Go back
  router.back();
};
```

### File Upload (formidable)

```javascript
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,  // Disable default body parser
  },
};

export default async function handler(req, res) {
  const form = formidable({ multiples: true });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed' });
    }
    
    // Process files
    const uploadedFile = files.file;
  });
}
```

### CSV Parsing (papaparse)

```javascript
import Papa from 'papaparse';

// Parse CSV
Papa.parse(file, {
  header: true,
  complete: (results) => {
    const data = results.data;
    // Process data
  },
});
```

### Environment Variables (dotenv)

```javascript
import 'dotenv/config';

const mongoUri = process.env.MONGODB_URI;
const clientId = process.env.GOOGLE_CLIENT_ID;

// Always validate environment variables
if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined');
}
```

---

## Code Patterns

### Error Handling Pattern

**Always use try-catch in async functions:**

```javascript
export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    // Your logic here
    const data = await Model.find({});
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Input Validation Pattern

**Always validate required inputs:**

```javascript
if (req.method === 'POST') {
  const { userId, name, description } = req.body;
  
  // Validate required fields
  if (!userId || !name) {
    return res.status(400).json({ error: 'User ID and name are required' });
  }
  
  // Verify references exist
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Proceed with logic
}
```

### Async/Await Pattern

**Use async/await instead of promises:**

```javascript
// ✅ Good
const fetchData = async () => {
  try {
    const response = await axios.get('/api/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// ❌ Avoid
const fetchData = () => {
  return axios.get('/api/data')
    .then(response => response.data)
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
};
```

### Loading State Pattern

**Track loading states for async operations:**

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await axios.post('/api/endpoint', data);
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// In JSX
{loading && <Spinner />}
{error && <Alert variant="danger">{error}</Alert>}
```

### Conditional Rendering Pattern

```javascript
// Conditional rendering with &&
{isLoggedIn && <UserMenu />}

// Conditional rendering with ternary
{loading ? <Spinner /> : <Content />}

// Multiple conditions
{loading ? (
  <Spinner />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <DataDisplay data={data} />
)}
```

### Array Mapping Pattern

```javascript
{campaigns.map((campaign) => (
  <CampaignCard
    key={campaign._id}
    campaign={campaign}
    onDelete={handleDelete}
  />
))}
```

**Always use unique keys in lists** (preferably database IDs, not array indices).

---

## Error Handling

### API Error Responses

**Standard error format:**

```javascript
return res.status(statusCode).json({ error: 'Error message' });
```

**Common status codes:**

- `400`: Bad Request (invalid input)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `405`: Method Not Allowed (wrong HTTP method)
- `500`: Internal Server Error (unexpected error)

### Client-Side Error Handling

```javascript
try {
  const response = await axios.post('/api/endpoint', data);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Server error:', error.response.data.error);
    alert(error.response.data.error);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
    alert('Network error. Please try again.');
  } else {
    // Other errors
    console.error('Error:', error.message);
    alert('An error occurred.');
  }
}
```

### Logging Pattern

**Use console.error for errors, console.log for info:**

```javascript
console.log('User logged in:', userId);
console.error('Database error:', error);
console.log('Request method:', req.method);
```

---

## Best Practices

### 1. **Always Connect to Database First**

```javascript
export default async function handler(req, res) {
  try {
    await connectToDatabase();  // First thing in try block
    // Then proceed with logic
  } catch (error) {
    // Error handling
  }
}
```

### 2. **Use Environment Variables for Secrets**

```javascript
// ✅ Good
const apiKey = process.env.API_KEY;

// ❌ Never
const apiKey = 'hardcoded-secret-key';
```

### 3. **Validate Inputs**

```javascript
if (!userId || !name) {
  return res.status(400).json({ error: 'Required fields missing' });
}
```

### 4. **Use Proper HTTP Methods**

- `GET`: Retrieve data (read-only)
- `POST`: Create new resources
- `PUT`: Update existing resources
- `DELETE`: Remove resources

### 5. **Return Early for Error Cases**

```javascript
if (!userId) {
  return res.status(400).json({ error: 'User ID required' });
}

// Continue with main logic...
```

### 6. **Use Meaningful Variable Names**

```javascript
// ✅ Good
const activeCampaigns = await Campaign.find({ state: 'active' });
const userEmail = user.email;

// ❌ Avoid
const c = await Campaign.find({ state: 'active' });
const e = user.email;
```

### 7. **Keep Components Small and Focused**

Each component should have a single responsibility. Break down large components into smaller, reusable pieces.

### 8. **Use Destructuring**

```javascript
// ✅ Good
const { userId, name, email } = req.body;

// ❌ Avoid
const userId = req.body.userId;
const name = req.body.name;
const email = req.body.email;
```

### 9. **Don't Repeat Yourself (DRY)**

Extract common logic into reusable functions or custom hooks.

### 10. **Handle Edge Cases**

```javascript
// Check for empty arrays
if (!campaigns || campaigns.length === 0) {
  return <EmptyState />;
}

// Check for null/undefined
if (!user) {
  return <div>User not found</div>;
}
```

### 11. **Use TypeScript Gradually**

The project supports TypeScript (`tsconfig.json` present). You can gradually introduce `.ts` and `.tsx` files:

```typescript
// TypeScript component example
interface CampaignProps {
  campaign: Campaign;
  metrics: Metrics;
  onDelete: (id: string) => void;
}

const CampaignCard: React.FC<CampaignProps> = ({ campaign, metrics, onDelete }) => {
  // Component logic
};
```

### 12. **Security Headers**

Always set security headers in sensitive endpoints:

```javascript
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-Content-Type-Options', 'nosniff');
```

### 13. **Use Consistent Sorting**

When fetching lists, sort consistently (usually by creation date):

```javascript
const campaigns = await Campaign.find({ user: userId })
  .sort({ createdAt: -1 });  // Newest first
```

### 14. **Clean Up Resources**

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);

  // Cleanup function
  return () => clearInterval(interval);
}, []);
```

---

## Quick Reference

### Creating a New API Endpoint

1. Create file in `pages/api/` (e.g., `pages/api/my-endpoint.js`)
2. Follow the standard handler pattern
3. Import database connection and models
4. Handle different HTTP methods
5. Validate inputs
6. Return appropriate responses

### Creating a New Component

1. Create file in `components/` (e.g., `components/MyComponent.js`)
2. Use PascalCase for the filename
3. Follow the standard component pattern
4. Export as default
5. Use destructured props
6. Use hooks for state management

### Creating a New Model

1. Open `models/EmailEvent.js`
2. Define schema with `new mongoose.Schema({})`
3. Create model with fallback: `mongoose.models?.Model || mongoose.model('Model', Schema)`
4. Add to exports: `export { User, NewModel, ... }`

### Creating a New Page

1. Create file in `pages/` (e.g., `pages/my-page.js`)
2. Export a React component
3. Use Next.js features like `useRouter` for navigation
4. File-based routing automatically creates the route

---

## Summary

This codebase follows modern Next.js and React best practices with a focus on:

- **Serverless optimization**: Cached database connections, stateless design
- **Clear separation of concerns**: API routes, components, models
- **Consistent patterns**: Standard handlers, component structure, naming
- **MongoDB/Mongoose**: Schema-based data modeling with references
- **React hooks**: Modern state management approach
- **Error handling**: Try-catch everywhere, meaningful error messages
- **OAuth integration**: Secure token storage and management

When building a similar project, follow these conventions to maintain consistency and scalability. The patterns here are optimized for Vercel serverless deployment and can serve as a template for any Next.js email tracking or campaign management application.