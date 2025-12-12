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
 * Strong ease-out: starts fast, ends very slow
 * Using quintic (power of 5) for more dramatic slowdown
 */
function easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5);
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
    const nextIdRef = useRef(0);
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

    const spawnReward = useCallback((type: RewardType, text: string, sourceX: number, sourceY: number) => {
        const target = targetsRef.current.get(type);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        // Calculate control point for bezier curve
        // Arc upward and to the side for a nice swooping motion
        const midX = (sourceX + targetX) / 2;
        
        // Offset the control point upward and slightly toward the start
        // This creates a nice arc that goes up first then curves down to target
        const controlX = midX - (targetX - sourceX) * 0.3;
        const controlY = Math.min(sourceY, targetY) - 100; // Arc upward

        const particle: FlyingParticle = {
            id: `flying-${nextIdRef.current++}`,
            type,
            text,
            startX: sourceX,
            startY: sourceY,
            controlX,
            controlY,
            targetX,
            targetY,
            progress: 0,
        };

        setParticles(prev => [...prev, particle]);
    }, []);

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

                    // Trigger pulse when particle is ~50% of the way there
                    if (newProgress >= 0.5 && !pulsedParticlesRef.current.has(particle.id)) {
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
                // Apply easing to progress (start fast, end slow)
                const eased = easeOutQuint(particle.progress);
                
                // Calculate position along bezier curve
                const x = quadraticBezier(eased, particle.startX, particle.controlX, particle.targetX);
                const y = quadraticBezier(eased, particle.startY, particle.controlY, particle.targetY);
                
                // Scale shrinks as it approaches target
                const scale = 1 - eased * 0.4;
                
                // Opacity fades out exponentially after 50% progress
                // Stays fully visible until 50%, then fades out exponentially
                const opacity = eased < 0.5 ? 1 : 1 - Math.pow((eased - 0.5) / 0.5, 3);

                return (
                    <div
                        key={particle.id}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            opacity,
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#000',
                            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {particle.text}
                    </div>
                );
            })}
        </div>
    );
}
