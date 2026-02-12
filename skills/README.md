# Skills

This directory contains skills for the nextstop application, following Anthropic's best practices for building AI-assisted applications.

## What are Skills?

Skills are modular instruction sets that enhance AI capabilities for specific domains. They provide context-specific guidance that helps AI agents produce better, more consistent results.

## Available Skills

### Frontend Design

Located in `frontend-design/SKILL.md`, this skill guides the creation of distinctive, production-grade frontend interfaces that avoid generic AI aesthetics.

**When to use:**
- Building web components, pages, or full applications
- Designing user interfaces
- Creating visually distinctive experiences

**Key principles:**
- Bold aesthetic choices (not generic AI slop)
- Distinctive typography and color palettes
- High-impact animations and visual details
- Context-aware implementation
- Production-ready code

## Using Skills

Skills are markdown documents that can be referenced when working with AI coding assistants. They provide:

1. **Design thinking frameworks** - How to approach problems
2. **Technical guidelines** - Best practices and patterns
3. **Implementation details** - Specific techniques and tools
4. **Quality standards** - What defines "done"

## Creating New Skills

When creating new skills:

1. Create a directory under `skills/` with a descriptive name
2. Add a `SKILL.md` file with frontmatter containing:
   - `name`: Short identifier
   - `description`: What the skill does
3. Structure the content with clear sections:
   - Context and when to use
   - Principles and guidelines
   - Technical implementation details
   - Examples and patterns

## Best Practices

- Keep skills focused on a single domain
- Make them reusable across projects
- Update skills as patterns evolve
- Share successful patterns as new skills
- Reference official documentation and standards

## Learn More

- [Anthropic Skills Guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide)
- [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb)
- [Claude Code Plugins](https://github.com/anthropics/claude-code/tree/main/plugins)
