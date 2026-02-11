import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="hero">
        <div className="accent-block" />
        <h1>
          Next
          <br />
          Stop
        </h1>
        <p className="tagline">Where Distinctive Design Meets Modern Development</p>
      </header>

      <section className="content">
        <div className="feature-grid">
          <div className="feature-card">
            <h2>Bold Typography</h2>
            <p>
              Distinctive font combinations that elevate every interface. No generic system fonts
              here.
            </p>
          </div>

          <div className="feature-card">
            <h2>Creative Motion</h2>
            <p>
              High-impact animations that delight users. Staggered reveals and purposeful
              transitions.
            </p>
          </div>

          <div className="feature-card">
            <h2>Intentional Design</h2>
            <p>
              Every choice is deliberate. From color palettes to spatial composition, nothing is
              accidental.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Built with Anthropic's Best Practices</h2>
        <p className="description">
          This project demonstrates how to create production-grade applications using AI-assisted
          development with skills-based architecture.
        </p>
        <div className="button-group">
          <button
            onClick={() => window.open('https://github.com/AaronBuxbaum/nextstop', '_blank')}
          >
            View on GitHub
          </button>
          <button
            className="secondary"
            onClick={() =>
              window.open('/skills/frontend-design/SKILL.md', '_blank')
            }
          >
            Read the Skills
          </button>
        </div>
      </section>

      <footer className="footer">
        <p>
          Crafted with distinctive design principles.{' '}
          <a href="https://github.com/anthropics/claude-code" target="_blank" rel="noopener noreferrer">
            Inspired by Anthropic
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
