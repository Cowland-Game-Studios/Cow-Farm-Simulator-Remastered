/**
 * ParticleRenderer Component
 * 
 * Renders particles from the particle system engine.
 * Uses CSS transforms for performant animations.
 */

import { useParticles } from '../../engine/particleSystem';
import styles from './particles.module.css';

export default function ParticleRenderer() {
    const particles = useParticles();

    if (particles.length === 0) return null;

    return (
        <div className={styles.particleContainer}>
            {particles.map((particle) => (
                <p
                    key={particle.id}
                    className={styles.particle}
                    style={{
                        transform: `translate(${particle.x}px, ${particle.y}px)`,
                        opacity: particle.opacity,
                        color: particle.color,
                    }}
                >
                    {particle.text}
                </p>
            ))}
        </div>
    );
}
