/**
 * Particle System Engine
 * 
 * Features:
 * - Gravity-based particles that float up and fall down
 * - Text particles with customizable content
 * - Fade out animation
 * - Configurable physics (gravity direction, velocity, etc.)
 * - Object pooling for memory efficiency
 * - Max particle limit to prevent unbounded growth
 */

import { useState, useEffect } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';

const { PARTICLES } = GAME_CONFIG;

// Memory management constants
const MAX_PARTICLES = 100; // Maximum active particles
const POOL_SIZE = 150; // Object pool size (slightly larger than max to handle bursts)

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
// PARTICLE SYSTEM CLASS (with Object Pooling)
// ============================================

type ParticleListener = (particles: Particle[]) => void;

class ParticleSystem {
    private activeParticles: Map<string, Particle>;
    private particlePool: Particle[];
    private listeners: Set<ParticleListener>;
    private animationFrameId: number | null;
    private lastTick: number;
    private running: boolean;
    private nextId: number;

    constructor() {
        this.activeParticles = new Map();
        this.particlePool = [];
        this.listeners = new Set();
        this.animationFrameId = null;
        this.lastTick = performance.now();
        this.running = false;
        this.nextId = 0;
        
        // Pre-allocate particle pool
        this.initializePool();
    }

    /**
     * Pre-allocate particles for object pooling
     */
    private initializePool(): void {
        for (let i = 0; i < POOL_SIZE; i++) {
            this.particlePool.push(this.createEmptyParticle());
        }
    }

    /**
     * Create an empty particle object for the pool
     */
    private createEmptyParticle(): Particle {
        return {
            id: '',
            text: '',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            gravity: 0,
            opacity: 0,
            fadeRate: 0,
            fadeDelay: 0,
            color: '',
            fontSize: 0,
            createdAt: 0,
            lifetime: 0,
        };
    }

    /**
     * Get a particle from the pool or create a new one if pool is empty
     */
    private acquireParticle(): Particle {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop()!;
        }
        // Pool exhausted, create new particle (rare case)
        return this.createEmptyParticle();
    }

    /**
     * Return a particle to the pool
     */
    private releaseParticle(particle: Particle): void {
        // Only add back to pool if under limit
        if (this.particlePool.length < POOL_SIZE) {
            this.particlePool.push(particle);
        }
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
        const particleArray = Array.from(this.activeParticles.values());
        this.listeners.forEach(cb => cb(particleArray));
    }

    /**
     * Spawn a new particle
     * Returns empty string if max particles reached
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
        // Enforce max particle limit
        if (this.activeParticles.size >= MAX_PARTICLES) {
            // Remove oldest particle to make room
            const oldestId = this.activeParticles.keys().next().value;
            if (oldestId) {
                const oldParticle = this.activeParticles.get(oldestId);
                if (oldParticle) {
                    this.releaseParticle(oldParticle);
                }
                this.activeParticles.delete(oldestId);
            }
        }

        const id = `p_${this.nextId++}`;
        const particle = this.acquireParticle();
        
        // Reset particle properties
        particle.id = id;
        particle.text = text;
        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.gravity = gravity;
        particle.opacity = 1;
        particle.fadeRate = 0;
        particle.fadeDelay = fadeDelay;
        particle.color = color;
        particle.fontSize = fontSize;
        particle.createdAt = performance.now();
        particle.lifetime = lifetime;

        this.activeParticles.set(id, particle);

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
        const toRemove: string[] = [];

        for (const [id, particle] of this.activeParticles) {
            const age = now - particle.createdAt;

            // Mark expired particles for removal
            if (age > particle.lifetime || particle.opacity <= 0) {
                toRemove.push(id);
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

        // Remove expired particles and return them to pool
        for (const id of toRemove) {
            const particle = this.activeParticles.get(id);
            if (particle) {
                this.releaseParticle(particle);
            }
            this.activeParticles.delete(id);
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
     * Clear all particles (return to pool)
     */
    clear(): void {
        for (const particle of this.activeParticles.values()) {
            this.releaseParticle(particle);
        }
        this.activeParticles.clear();
        this.notify();
    }

    /**
     * Get current particle count
     */
    getCount(): number {
        return this.activeParticles.size;
    }

    /**
     * Get pool statistics (for debugging)
     */
    getPoolStats(): { active: number; pooled: number; maxActive: number } {
        return {
            active: this.activeParticles.size,
            pooled: this.particlePool.length,
            maxActive: MAX_PARTICLES,
        };
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

