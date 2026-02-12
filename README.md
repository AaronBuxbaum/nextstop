# nextstop

A modern web application built with Anthropic's best practices for AI-assisted development, featuring distinctive frontend design and modular skill-based architecture.

## 🎨 Design Philosophy

This project follows Anthropic's frontend design principles:
- **Distinctive aesthetics** - No generic AI-generated designs
- **Bold choices** - Clear aesthetic direction with intentional execution
- **Production quality** - Functional, accessible, and performant code
- **Creative typography** - Unique font combinations that elevate the experience
- **Thoughtful motion** - High-impact animations and micro-interactions

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

- **Frontend Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: CSS Modules with Tailwind CSS
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint for consistent code style
- **Deployment**: Optimized for Vercel with automatic deployments

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AaronBuxbaum/nextstop.git
cd nextstop
```

2. Install dependencies:
```bash
cd app
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📚 Skills

This project includes modular skills that guide AI-assisted development:

- **[Frontend Design](./skills/frontend-design/SKILL.md)** - Create distinctive, production-grade interfaces

See the [skills README](./skills/README.md) for more details on using and creating skills.

## 🛠️ Development

### Available Scripts

In the `app/` directory:

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Standards

- Write clean, maintainable, well-documented code
- Follow TypeScript best practices
- Ensure accessibility (ARIA labels, semantic HTML, keyboard navigation)
- Test before committing
- Keep commits focused and atomic

## 🎯 Project Goals

1. **Demonstrate best practices** from Anthropic for building AI-assisted applications
2. **Create distinctive UIs** that stand out from generic AI-generated designs
3. **Maintain high quality** with TypeScript, linting, and automated checks
4. **Build modularly** with reusable skills and components
5. **Stay performant** with optimized builds and lazy loading

## 📖 Resources

- [Anthropic Skills Guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide)
- [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb)
- [Claude Code](https://github.com/anthropics/claude-code)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)

## 📝 License

ISC

## 👥 Contributing

This repository is in its early stages of development. Contributions are welcome! Please:

1. Follow the existing code style and patterns
2. Update documentation for functional changes
3. Add tests where applicable
4. Keep PRs focused and well-described
