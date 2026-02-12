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
            <h2>Bold Typography</h2>
            <p>
              Distinctive font combinations that elevate every interface. No generic system fonts
              here.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h2>Creative Motion</h2>
            <p>
              High-impact animations that delight users. Staggered reveals and purposeful
              transitions.
            </p>
          </div>

          <div className={styles.featureCard}>
            <h2>Intentional Design</h2>
            <p>
              Every choice is deliberate. From color palettes to spatial composition, nothing is
              accidental.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2>Built with Anthropic&apos;s Best Practices</h2>
        <p className={styles.description}>
          This project demonstrates how to create production-grade applications using AI-assisted
          development with skills-based architecture.
        </p>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => window.open('https://github.com/AaronBuxbaum/nextstop', '_blank')}
          >
            View on GitHub
          </button>
          <button
            className={styles.secondary}
            onClick={() =>
              window.open('https://github.com/AaronBuxbaum/nextstop/blob/main/skills/frontend-design/SKILL.md', '_blank')
            }
          >
            Read the Skills
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
