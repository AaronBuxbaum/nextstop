# NextStop

**NextStop** is an AI-powered outing planning application that helps you create amazing experiences with friends and family. Built with modern web technologies and real-time collaboration capabilities.

## ✨ Features

### 🎯 Smart Planning
- **Event Management**: Create detailed events with locations, times, descriptions, and notes
- **Branching Options**: Build flexible plans with multiple paths and decision points
- **Optional Events**: Keep a list of backup activities and spontaneous ideas

### 🤖 AI-Powered Assistance
- **Pacing Analysis**: Get intelligent feedback on event timing and flow
- **Quality Assessment**: Receive suggestions to improve your outing
- **Theme Generation**: AI helps identify and strengthen your plan's theme
- **Smart Suggestions**: Get contextual recommendations for new events

### 👥 Real-Time Collaboration
- **Multi-User Editing**: Plan together with friends and family
- **Live Updates**: See changes as they happen
- **Presence Indicators**: Know who's actively working on the plan
- **Conflict Resolution**: Smart handling of simultaneous edits

### 🎨 Beautiful Interface
- **Distinctive Design**: Modern, elegant UI following Anthropic's design principles
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Intuitive Navigation**: Easy to use, hard to mess up

## 🏗️ Architecture

### Skills-Based Development

The project uses a modular skill system inspired by Anthropic's Claude Code plugins:

```
nextstop/
├── app/              # Frontend application (Next.js + TypeScript)
├── skills/           # Modular AI instruction sets
│   └── frontend-design/  # Guides for building distinctive UIs
└── .github/          # CI/CD and project configuration
```

### Tech Stack

**Frontend**
- Next.js 16 with App Router and React 19
- TypeScript for type safety
- CSS Modules with Tailwind CSS
- Distinctive typography (Playfair Display + Courier Prime)

**Backend**
- Next.js API Routes (serverless functions)
- Neon Postgres (formerly Vercel Postgres)
- Upstash Redis for real-time collaboration
- Vercel Blob for file storage

**AI & Integrations**
- Vercel AI SDK
- OpenAI GPT-4 for analysis and suggestions
- NextAuth for authentication

**Testing & Quality**
- Vitest for unit and integration tests
- Mock Service Worker (MSW) for API mocking
- TypeScript strict mode
- ESLint for code quality

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Vercel account (for deployment)
- OpenAI API key (for AI features)
- Neon Postgres database (free tier available)
- Upstash Redis instance (free tier available)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/AaronBuxbaum/nextstop.git
cd nextstop/app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   
Create a `.env.local` file in the `app` directory based on `.env.example`:

```bash
# Database (Neon Postgres)
DATABASE_URL=your_neon_database_url

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Vercel Blob Storage (optional)
BLOB_READ_WRITE_TOKEN=your_blob_token

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# OpenAI for AI features
OPENAI_API_KEY=your_openai_api_key

# Application
NODE_ENV=development
```

4. **Initialize the database:**

The database tables will be created automatically on first run, or you can run:

```bash
# Run database initialization (coming soon)
npm run db:init
```

5. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Database Setup

#### Neon Postgres Setup

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add it to your `.env.local` as `DATABASE_URL`

#### Upstash Redis Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and token
4. Add them to your `.env.local`

### Getting API Keys

#### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env.local` as `OPENAI_API_KEY`

## 📖 Usage

### Creating Your First Plan

1. Navigate to the Plans page from the home screen
2. Click "New Plan"
3. Enter a title for your outing
4. Start adding events with details like:
   - Event title and description
   - Location information
   - Start and end times
   - Duration
   - Notes and tags

### Using AI Features

**Get AI Analysis:**
- Click the "🤖 AI Analysis" button on any plan
- Review feedback on pacing, quality, and theme
- Implement suggested improvements

**Get Suggestions:**
- Click "💡 Get Suggestions" to receive AI-generated ideas
- Review contextual recommendations
- Add suggested events to your plan

### Collaboration (Coming Soon)

- Share plan links with collaborators
- See real-time updates as others edit
- View who's currently active on the plan

## 📚 Skills

This project includes modular skills that guide AI-assisted development:

- **[Frontend Design](./skills/frontend-design/SKILL.md)** - Create distinctive, production-grade interfaces

See the [skills README](./skills/README.md) for more details on using and creating skills.

## 🛠️ Development

### Available Scripts

In the `app/` directory:

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage report

### Project Structure

```
nextstop/
├── app/                      # Next.js application
│   ├── app/                  # App Router pages and layouts
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── plans/       # Plan CRUD operations
│   │   │   ├── events/      # Event CRUD operations
│   │   │   └── ai/          # AI analysis and suggestions
│   │   ├── plans/           # Plans dashboard and detail pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions and configs
│   │   ├── db.ts           # Database client
│   │   └── redis.ts        # Redis client
│   ├── types/              # TypeScript type definitions
│   ├── mocks/              # MSW mock handlers
│   └── __tests__/          # Test files
├── skills/                 # AI instruction sets
└── .github/                # CI/CD and project configuration
```

### API Endpoints

#### Plans
- `GET /api/plans` - List all plans for the current user
- `POST /api/plans` - Create a new plan
- `GET /api/plans/:id` - Get plan details with events
- `PATCH /api/plans/:id` - Update a plan
- `DELETE /api/plans/:id` - Delete a plan

#### Events
- `POST /api/events` - Create a new event
- `PATCH /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

#### AI
- `POST /api/ai/analyze` - Analyze plan pacing, quality, and theme
- `POST /api/ai/suggest` - Get AI suggestions for improvements

#### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Testing

This project uses Vitest and Mock Service Worker for testing.

**Run tests:**
```bash
npm test
```

**Run tests with UI:**
```bash
npm run test:ui
```

**Generate coverage:**
```bash
npm run test:coverage
```

**Writing Tests:**

Tests are located in `__tests__/` directories. Example:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '@/components/EventCard';

describe('EventCard', () => {
  it('renders event details', () => {
    const event = {
      id: '1',
      title: 'Coffee Shop',
      location: 'Corner Cafe',
      // ...
    };
    
    render(<EventCard event={event} />);
    expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
  });
});
```

### Code Standards

- **TypeScript**: Use strict mode, define proper types
- **Components**: Use functional components with hooks
- **Styling**: CSS Modules for component styles
- **API Routes**: Use Next.js App Router conventions
- **Testing**: Write tests for new features and bug fixes
- **Commits**: Use descriptive commit messages
- **Accessibility**: Include ARIA labels and semantic HTML

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Set Environment Variables:**
   
In Vercel dashboard, add all variables from `.env.example`:
   - `DATABASE_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)

4. **Database Setup:**
   - Neon Postgres is automatically production-ready
   - No additional configuration needed

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] OpenAI API key verified
- [ ] Authentication working
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security audit completed

## 🎯 Roadmap

### Current Features
- ✅ Plan creation and management
- ✅ Event creation with detailed information
- ✅ AI-powered pacing and quality analysis
- ✅ AI suggestions for improvements
- ✅ Theme identification and coherence checking
- ✅ Modern, responsive UI
- ✅ Mock Service Worker for testing

### Coming Soon
- 🔄 Real-time collaboration with WebSockets
- 🔄 User presence indicators
- 🔄 Branching paths with decision logic
- 🔄 Optional events management
- 🔄 Event visualization timeline
- 🔄 User authentication and accounts
- 🔄 Plan sharing and permissions
- 🔄 Mobile app (React Native)
- 🔄 Calendar integration
- 🔄 Weather integration for outdoor events
- 🔄 Location search with Google Maps
- 🔄 Budget tracking
- 🔄 Photo attachments
- 🔄 Export to PDF/calendar

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Run tests and linting (`npm test && npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

ISC

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- AI powered by [OpenAI](https://openai.com/)
- Inspired by [Anthropic's](https://www.anthropic.com/) best practices
- Design philosophy from Anthropic's frontend aesthetics guide
- Database by [Neon](https://neon.tech/)
- Redis by [Upstash](https://upstash.com/)
- Hosted on [Vercel](https://vercel.com/)

## 📧 Support

For questions or issues:
- Open an [issue](https://github.com/AaronBuxbaum/nextstop/issues)
- Check the [discussions](https://github.com/AaronBuxbaum/nextstop/discussions)
- Read the [documentation](https://github.com/AaronBuxbaum/nextstop#readme)

---

Built with ❤️ using AI-assisted development
