/**
 * Particle System Engine
 * 
 * Features:
 * - Gravity-based particles that float up and fall down
 * - Text particles with customizable content
 * - Fade out animation
 * - Configurable physics (gravity direction, velocity, etc.)
 */

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';

const { PARTICLES } = GAME_CONFIG;

// ============================================
// PARTICLE TYPES
// ============================================

export interface Particle {
    id: string;
    text: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravity: number;
    opacity: number;
    fadeRate: number;
    fadeDelay: number;
    color: string;
    fontSize: number;
    createdAt: number;
    lifetime: number;
}

export interface SpawnOptions {
    text?: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    gravity?: number;
    color?: string;
    fontSize?: number;
    lifetime?: number;
    fadeDelay?: number;
}

export interface BurstOptions {
    x?: number;
    y?: number;
    count?: number;
    text?: string;
    color?: string;
    speed?: number;
    gravity?: number;
    lifetime?: number;
    fadeDelay?: number;
    spread?: number;
    startAngle?: number;
}

export interface ExplosionOptions {
    count?: number;
    text?: string;
    color?: string;
    speed?: number;
    gravity?: number;
    lifetime?: number;
    fadeDelay?: number;
}

export interface SprayOptions {
    count?: number;
    text?: string;
    color?: string;
    speed?: number;
    gravity?: number;
    lifetime?: number;
    fadeDelay?: number;
    spread?: number;
}

// ============================================
// PARTICLE SYSTEM CLASS
// ============================================

type ParticleListener = (particles: Particle[]) => void;

class ParticleSystem {
    private particles: Map<string, Particle>;
    private listeners: Set<ParticleListener>;
    private animationFrameId: number | null;
    private lastTick: number;
    private running: boolean;

    constructor() {
        this.particles = new Map();
        this.listeners = new Set();
        this.animationFrameId = null;
        this.lastTick = performance.now();
        this.running = false;
    }

    /**
     * Subscribe to particle updates
     */
    subscribe(callback: ParticleListener): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of current particles
     */
    private notify(): void {
        const particleArray = Array.from(this.particles.values());
        this.listeners.forEach(cb => cb(particleArray));
    }

    /**
     * Spawn a new particle
     */
    spawn({
        text = '+1',
        x = 0,
        y = 0,
        vx = 0,
        vy = PARTICLES.DEFAULT_VY,
        gravity = PARTICLES.DEFAULT_GRAVITY,
        color = '#fff',
        fontSize = PARTICLES.DEFAULT_FONT_SIZE,
        lifetime = PARTICLES.DEFAULT_LIFETIME_MS,
        fadeDelay = PARTICLES.DEFAULT_FADE_DELAY_MS,
    }: SpawnOptions = {}): string {
        const id = uuidv4();
        const particle: Particle = {
            id,
            text,
            x,
            y,
            vx,
            vy,
            gravity,
            opacity: 1,
            fadeRate: 0,
            fadeDelay,
            color,
            fontSize,
            createdAt: performance.now(),
            lifetime,
        };

        this.particles.set(id, particle);

        // Start loop if not running
        if (!this.running) {
            this.start();
        }

        return id;
    }

    /**
     * Spawn a "+1 milk" collection particle
     */
    spawnMilkParticle(x: number, y: number): string {
        return this.spawn({
            text: '+1 milk',
            x,
            y,
            vx: (Math.random() - 0.5) * PARTICLES.MILK_VX_RANGE,
            vy: PARTICLES.MILK_VY,
            gravity: PARTICLES.MILK_GRAVITY,
            color: '#000000',
            lifetime: PARTICLES.MILK_LIFETIME_MS,
            fadeDelay: PARTICLES.MILK_FADE_DELAY_MS,
        });
    }

    /**
     * Spawn a "-1 grass" feed consumption particle (floats up, then falls)
     */
    spawnFeedParticle(x: number, y: number): string {
        return this.spawn({
            text: '-1 grass',
            x,
            y,
            vx: (Math.random() - 0.5) * PARTICLES.MILK_VX_RANGE,
            vy: PARTICLES.FEED_VY,
            gravity: PARTICLES.FEED_GRAVITY,
            color: '#000000',
            lifetime: PARTICLES.FEED_LIFETIME_MS,
            fadeDelay: PARTICLES.FEED_FADE_DELAY_MS,
        });
    }

    /**
     * Spawn a "+1 cow" breeding particle
     */
    spawnBreedParticle(x: number, y: number): string {
        return this.spawn({
            text: '+1 cow',
            x,
            y,
            vx: (Math.random() - 0.5) * PARTICLES.MILK_VX_RANGE,
            vy: PARTICLES.BREED_VY,
            gravity: PARTICLES.BREED_GRAVITY,
            color: '#000000',
            lifetime: PARTICLES.BREED_LIFETIME_MS,
            fadeDelay: PARTICLES.BREED_FADE_DELAY_MS,
        });
    }

    /**
     * Spawn a crafting particle (e.g., "-1 Cream", "+1 Butter")
     */
    spawnCraftingPlaceParticle(x: number, y: number, text: string): string {
        return this.spawn({
            text,
            x,
            y,
            vx: (Math.random() - 0.5) * PARTICLES.CRAFTING_VX_RANGE,
            vy: PARTICLES.CRAFTING_VY,
            gravity: PARTICLES.CRAFTING_GRAVITY,
            color: '#000000',
            fontSize: PARTICLES.CRAFTING_FONT_SIZE,
            lifetime: PARTICLES.CRAFTING_LIFETIME_MS,
            fadeDelay: PARTICLES.CRAFTING_FADE_DELAY_MS,
        });
    }

    /**
     * Spawn multiple particles in an explosion pattern
     */
    spawnBurst({
        x = 0,
        y = 0,
        count = PARTICLES.BURST_DEFAULT_COUNT,
        text = '•',
        color = '#000000',
        speed = PARTICLES.BURST_DEFAULT_SPEED,
        gravity = PARTICLES.BURST_DEFAULT_GRAVITY,
        lifetime = PARTICLES.BURST_DEFAULT_LIFETIME_MS,
        fadeDelay = PARTICLES.BURST_DEFAULT_FADE_DELAY_MS,
        spread = Math.PI * 2, // Full circle by default
        startAngle = 0, // Starting angle in radians
    }: BurstOptions = {}): string[] {
        const ids: string[] = [];
        const angleStep = spread / count;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (i * angleStep) + (Math.random() - 0.5) * PARTICLES.BURST_ANGLE_VARIANCE;
            const velocity = speed * (1 - PARTICLES.BURST_SPEED_VARIANCE / 2 + Math.random() * PARTICLES.BURST_SPEED_VARIANCE);

            const id = this.spawn({
                text,
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                gravity,
                color,
                lifetime,
                fadeDelay,
            });
            ids.push(id);
        }

        return ids;
    }

    /**
     * Spawn particles radiating outward from a point
     */
    spawnExplosion(x: number, y: number, options: ExplosionOptions = {}): string[] {
        return this.spawnBurst({
            x,
            y,
            count: options.count || PARTICLES.EXPLOSION_DEFAULT_COUNT,
            text: options.text || '•',
            color: options.color || '#000000',
            speed: options.speed || PARTICLES.EXPLOSION_DEFAULT_SPEED,
            gravity: options.gravity || PARTICLES.EXPLOSION_DEFAULT_GRAVITY,
            lifetime: options.lifetime || PARTICLES.EXPLOSION_DEFAULT_LIFETIME_MS,
            fadeDelay: options.fadeDelay || PARTICLES.EXPLOSION_DEFAULT_FADE_DELAY_MS,
            spread: Math.PI * 2,
            startAngle: 0,
        });
    }

    /**
     * Spawn particles in a cone/fan pattern (e.g., upward spray)
     */
    spawnSpray(x: number, y: number, direction: number = -Math.PI / 2, options: SprayOptions = {}): string[] {
        const spreadAngle = options.spread || PARTICLES.SPRAY_DEFAULT_SPREAD;
        return this.spawnBurst({
            x,
            y,
            count: options.count || PARTICLES.SPRAY_DEFAULT_COUNT,
            text: options.text || '•',
            color: options.color || '#000000',
            speed: options.speed || PARTICLES.SPRAY_DEFAULT_SPEED,
            gravity: options.gravity || PARTICLES.SPRAY_DEFAULT_GRAVITY,
            lifetime: options.lifetime || PARTICLES.SPRAY_DEFAULT_LIFETIME_MS,
            fadeDelay: options.fadeDelay || PARTICLES.SPRAY_DEFAULT_FADE_DELAY_MS,
            spread: spreadAngle,
            startAngle: direction - spreadAngle / 2,
        });
    }

    /**
     * Start the particle update loop
     */
    private start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTick = performance.now();
        this.tick();
    }

    /**
     * Stop the particle update loop
     */
    private stop(): void {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main update tick
     */
    private tick(): void {
        if (!this.running) return;

        const now = performance.now();
        const delta = (now - this.lastTick) / PARTICLES.FRAME_TIME_MS; // Normalize to ~60fps
        this.lastTick = now;

        let hasActiveParticles = false;

        for (const [id, particle] of this.particles) {
            const age = now - particle.createdAt;

            // Remove expired particles
            if (age > particle.lifetime || particle.opacity <= 0) {
                this.particles.delete(id);
                continue;
            }

            hasActiveParticles = true;

            // Apply gravity to velocity
            particle.vy += particle.gravity * delta;

            // Update position
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;

            // Apply damping to horizontal movement
            particle.vx *= PARTICLES.HORIZONTAL_DAMPING;

            // Start fading after delay
            if (age > particle.fadeDelay) {
                const fadeTime = particle.lifetime - particle.fadeDelay;
                const fadeProgress = (age - particle.fadeDelay) / fadeTime;
                particle.opacity = Math.max(0, 1 - fadeProgress);
            }
        }

        // Notify listeners
        this.notify();

        // Stop loop if no particles
        if (!hasActiveParticles) {
            this.stop();
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => this.tick());
    }

    /**
     * Clear all particles
     */
    clear(): void {
        this.particles.clear();
        this.notify();
    }

    /**
     * Get current particle count
     */
    getCount(): number {
        return this.particles.size;
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const particleSystem = new ParticleSystem();

// ============================================
// REACT HOOK
// ============================================

/**
 * React hook to subscribe to particle system updates
 */
export function useParticles(): Particle[] {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const unsubscribe = particleSystem.subscribe(setParticles);
        return unsubscribe;
    }, []);

    return particles;
}

export default particleSystem;

