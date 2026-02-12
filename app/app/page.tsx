"use client";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.appContainer}>
      <header className={styles.hero}>
        <div className={styles.accentBlock} />
        <h1>
          Next
          <br />
          Stop
        </h1>
        <p className={styles.tagline}>Where Distinctive Design Meets Modern Development</p>
      </header>

      <section className={styles.content}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h2>AI-Powered Planning</h2>
            <p>
              Get intelligent suggestions for pacing, quality, and themes. AI helps you create
              unforgettable experiences.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h2>Real-Time Collaboration</h2>
            <p>
              Plan together with friends and family. See updates in real-time as your group builds
              the perfect day.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h2>Branching & Options</h2>
            <p>
              Create flexible plans with multiple options. Adapt to weather, preferences, or
              spontaneous decisions.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2>Plan Your Perfect Outing</h2>
        <p className={styles.description}>
          NextStop helps you plan amazing outings with AI-powered suggestions, real-time collaboration,
          and smart pacing analysis. Create your first plan today!
        </p>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => window.location.href = '/plans'}
          >
            Start Planning
          </button>
          <button
            className={styles.secondary}
            onClick={() => window.open('https://github.com/AaronBuxbaum/nextstop', '_blank')}
          >
            View on GitHub
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Crafted with distinctive design principles.{' '}
          <a href="https://github.com/anthropics/claude-code" target="_blank" rel="noopener noreferrer">
            Inspired by Anthropic
          </a>
        </p>
      </footer>
    </div>
  );
}
