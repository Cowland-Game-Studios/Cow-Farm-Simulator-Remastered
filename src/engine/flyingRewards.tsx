/**
 * Flying Rewards System
 * 
 * Creates particles that fly from a source to a target element,
 * triggering an animation on the target when they arrive.
 * 
 * Reusable for XP, coins, or any other flying reward effect.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export type RewardType = 'xp' | 'coins';

export interface FlyingParticle {
    id: string;
    type: RewardType;
    text: string;
    startX: number;
    startY: number;
    controlX: number;  // Bezier control point
    controlY: number;
    targetX: number;
    targetY: number;
    progress: number; // 0 to 1
}

interface FlyingRewardsContextValue {
    particles: FlyingParticle[];
    spawnReward: (type: RewardType, text: string, sourceX: number, sourceY: number) => void;
    registerTarget: (type: RewardType, element: HTMLElement | null) => void;
    pulsingTargets: Set<RewardType>;
}

// ============================================
// BEZIER HELPERS
// ============================================

/**
 * Quadratic bezier curve calculation
 * P = (1-t)²P0 + 2(1-t)tP1 + t²P2
 */
function quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
    const oneMinusT = 1 - t;
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

/**
 * Strong ease-in: starts slow, ends very fast
 * Using quintic (power of 5) for exponential acceleration
 */
function easeInQuint(t: number): number {
    return Math.pow(t, 5);
}

// ============================================
// CONTEXT
// ============================================

const FlyingRewardsContext = createContext<FlyingRewardsContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface FlyingRewardsProviderProps {
    children: React.ReactNode;
}

export function FlyingRewardsProvider({ children }: FlyingRewardsProviderProps): React.ReactElement {
    const [particles, setParticles] = useState<FlyingParticle[]>([]);
    const [pulsingTargets, setPulsingTargets] = useState<Set<RewardType>>(new Set());
    const targetsRef = useRef<Map<RewardType, HTMLElement>>(new Map());
    // nextIdRef kept for future use when particles are re-enabled
    // const nextIdRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTickRef = useRef(performance.now());

    const registerTarget = useCallback((type: RewardType, element: HTMLElement | null) => {
        if (element) {
            targetsRef.current.set(type, element);
        } else {
            targetsRef.current.delete(type);
        }
    }, []);

    const triggerPulse = useCallback((type: RewardType) => {
        setPulsingTargets(prev => new Set(prev).add(type));
        setTimeout(() => {
            setPulsingTargets(prev => {
                const next = new Set(prev);
                next.delete(type);
                return next;
            });
        }, 300);
    }, []);

    const spawnReward = useCallback((type: RewardType, _text: string, _sourceX: number, _sourceY: number) => {
        // Just trigger the pulse immediately without spawning visible particles
        triggerPulse(type);
    }, [triggerPulse]);

    // Track which particles have already triggered pulse (to avoid double-triggering)
    const pulsedParticlesRef = useRef<Set<string>>(new Set());

    // Animation loop
    useEffect(() => {
        const tick = () => {
            const now = performance.now();
            const delta = (now - lastTickRef.current) / 1000; // seconds
            lastTickRef.current = now;

            setParticles(prev => {
                if (prev.length === 0) return prev;

                const updated: FlyingParticle[] = [];

                for (const particle of prev) {
                    // Slower flight: ~800ms total (delta * 1.25)
                    const newProgress = particle.progress + delta * 1.25;

                    // Trigger pulse when particle is ~80% of the way there (since it accelerates)
                    if (newProgress >= 0.8 && !pulsedParticlesRef.current.has(particle.id)) {
                        pulsedParticlesRef.current.add(particle.id);
                        triggerPulse(particle.type);
                    }

                    // Remove particle when fully arrived
                    if (newProgress >= 1) {
                        pulsedParticlesRef.current.delete(particle.id);
                        continue;
                    }

                    updated.push({
                        ...particle,
                        progress: newProgress,
                    });
                }

                return updated;
            });

            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [triggerPulse]);

    const value: FlyingRewardsContextValue = {
        particles,
        spawnReward,
        registerTarget,
        pulsingTargets,
    };

    return (
        <FlyingRewardsContext.Provider value={value}>
            {children}
        </FlyingRewardsContext.Provider>
    );
}

// ============================================
// HOOKS
// ============================================

export function useFlyingRewards() {
    const context = useContext(FlyingRewardsContext);
    if (!context) {
        throw new Error('useFlyingRewards must be used within a FlyingRewardsProvider');
    }
    return context;
}

export function useRewardTarget(type: RewardType) {
    const { registerTarget, pulsingTargets } = useFlyingRewards();
    const ref = useCallback((element: HTMLElement | null) => {
        registerTarget(type, element);
    }, [registerTarget, type]);
    
    return {
        ref,
        isPulsing: pulsingTargets.has(type),
    };
}

// ============================================
// RENDERER COMPONENT
// ============================================

export function FlyingRewardsRenderer(): React.ReactElement | null {
    const { particles } = useFlyingRewards();

    if (particles.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
        }}>
            {particles.map(particle => {
                // Apply easing to progress (start slow, end fast - exponential acceleration)
                const eased = easeInQuint(particle.progress);
                
                // Calculate position along bezier curve
                const x = quadraticBezier(eased, particle.startX, particle.controlX, particle.targetX);
                const y = quadraticBezier(eased, particle.startY, particle.controlY, particle.targetY);
                
                // Scale shrinks exponentially as it approaches target
                const scale = 1 - Math.pow(eased, 2) * 0.6;
                
                // Opacity fades out exponentially - accelerates fade towards the end
                const opacity = 1 - Math.pow(eased, 3);

                return (
                    <p
                        key={particle.id}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            opacity,
                            margin: 0,
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '8px',
                            fontWeight: 400,
                            letterSpacing: '0.7px',
                            color: '#000',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {particle.text}
                    </p>
                );
            })}
        </div>
    );
}
