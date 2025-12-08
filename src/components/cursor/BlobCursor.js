import { useEffect, useRef, useState, useCallback } from "react";

const CURSOR_CONFIG = {
    // Default blob size
    DEFAULT_SIZE: 20,
    // How fast cursor follows mouse (0-1)
    LERP_SPEED: 0.5,
    // How fast cursor morphs to new shapes (0-1)
    SHAPE_LERP_SPEED: 0.15,
    // Default color
    COLOR: "rgba(0, 0, 0, 0.12)",
    // Hover color (slightly darker)
    HOVER_COLOR: "rgba(0, 0, 0, 0.08)",
    // Padding around hovered elements
    HOVER_PADDING: 8,
    // Selectors for hoverable elements (in order of priority)
    HOVER_SELECTORS: [
        '[data-cursor-target]',     // Explicit cursor targets
        '.cowContainer',            // Cows
        '.buttonContainer',         // Buttons
        'button',                   // Generic buttons
        'a',                        // Links
        '[role="button"]',          // Accessible buttons
        'input',                    // Inputs
        'select',                   // Selects
        'textarea',                 // Textareas
    ],
};

// Get the effective border radius of an element
function getBorderRadius(element) {
    const computed = window.getComputedStyle(element);
    const radius = computed.borderRadius;
    
    // Parse the radius (handle "50%" for circles)
    if (radius === '50%') {
        const rect = element.getBoundingClientRect();
        return Math.min(rect.width, rect.height) / 2;
    }
    
    return parseFloat(radius) || 0;
}

// Check if element or its children form a roughly circular/oval shape (like SVGs)
function isCircularElement(element) {
    const rect = element.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;
    
    // Check if it contains an SVG (cows, icons)
    const hasSVG = element.querySelector('svg') !== null;
    
    // Check if it's roughly square-ish (typical for icons/cows)
    const isSquarish = aspectRatio > 0.5 && aspectRatio < 2;
    
    return hasSVG && isSquarish;
}

// Find the hoverable element under cursor
function findHoverTarget(x, y) {
    const elements = document.elementsFromPoint(x, y);
    
    for (const element of elements) {
        // Skip the cursor itself
        if (element.getAttribute('data-blob-cursor') === 'true') continue;
        
        // Check against each selector
        for (const selector of CURSOR_CONFIG.HOVER_SELECTORS) {
            // Check if element matches or has a matching parent
            const target = element.closest(selector);
            if (target) {
                return target;
            }
        }
    }
    
    return null;
}

// Calculate target shape from element
function getTargetShape(element) {
    if (!element) {
        return {
            width: CURSOR_CONFIG.DEFAULT_SIZE,
            height: CURSOR_CONFIG.DEFAULT_SIZE,
            borderRadius: CURSOR_CONFIG.DEFAULT_SIZE / 2,
            offsetX: 0,
            offsetY: 0,
            isHovering: false,
        };
    }
    
    const rect = element.getBoundingClientRect();
    const padding = CURSOR_CONFIG.HOVER_PADDING;
    
    // Determine border radius
    let borderRadius;
    if (isCircularElement(element)) {
        // For circular elements (cows, icons), use ellipse
        borderRadius = Math.max(rect.width, rect.height) / 2 + padding;
    } else {
        // Use element's border radius + padding, with a minimum
        borderRadius = Math.max(getBorderRadius(element) + padding / 2, 12);
    }
    
    return {
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius,
        // Offset from cursor to element center
        offsetX: rect.left + rect.width / 2,
        offsetY: rect.top + rect.height / 2,
        isHovering: true,
    };
}

export default function BlobCursor({ mousePosition, isDragging = false }) {
    const [position, setPosition] = useState({ x: mousePosition.x, y: mousePosition.y });
    const [shape, setShape] = useState({
        width: CURSOR_CONFIG.DEFAULT_SIZE,
        height: CURSOR_CONFIG.DEFAULT_SIZE,
        borderRadius: CURSOR_CONFIG.DEFAULT_SIZE / 2,
        offsetX: 0,
        offsetY: 0,
        isHovering: false,
    });
    
    const animationRef = useRef(null);
    const positionRef = useRef({ x: mousePosition.x, y: mousePosition.y });
    const shapeRef = useRef(shape);
    const hoveredElementRef = useRef(null);

    // Lerp helper
    const lerp = useCallback((current, target, speed) => {
        return current + (target - current) * speed;
    }, []);

    useEffect(() => {
        // Initialize position to mouse on first render
        if (positionRef.current.x === 0 && positionRef.current.y === 0) {
            positionRef.current = { x: mousePosition.x, y: mousePosition.y };
        }

        const animate = () => {
            const currentPos = positionRef.current;
            const currentShape = shapeRef.current;
            
            // Find what we're hovering over
            const hoverTarget = findHoverTarget(mousePosition.x, mousePosition.y);
            const targetShape = getTargetShape(hoverTarget);
            
            // Track hovered element for potential styling
            hoveredElementRef.current = hoverTarget;
            
            // Lerp position towards mouse (or element center when hovering)
            let targetX, targetY;
            if (targetShape.isHovering) {
                targetX = targetShape.offsetX;
                targetY = targetShape.offsetY;
            } else {
                targetX = mousePosition.x;
                targetY = mousePosition.y;
            }
            
            const newX = lerp(currentPos.x, targetX, CURSOR_CONFIG.LERP_SPEED);
            const newY = lerp(currentPos.y, targetY, CURSOR_CONFIG.LERP_SPEED);
            
            // Lerp shape towards target shape
            const newWidth = lerp(currentShape.width, targetShape.width, CURSOR_CONFIG.SHAPE_LERP_SPEED);
            const newHeight = lerp(currentShape.height, targetShape.height, CURSOR_CONFIG.SHAPE_LERP_SPEED);
            const newRadius = lerp(currentShape.borderRadius, targetShape.borderRadius, CURSOR_CONFIG.SHAPE_LERP_SPEED);
            
            positionRef.current = { x: newX, y: newY };
            shapeRef.current = {
                width: newWidth,
                height: newHeight,
                borderRadius: newRadius,
                isHovering: targetShape.isHovering,
            };
            
            setPosition({ x: newX, y: newY });
            setShape({
                width: newWidth,
                height: newHeight,
                borderRadius: newRadius,
                isHovering: targetShape.isHovering,
            });
            
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [mousePosition, lerp]);

    return (
        <div
            data-blob-cursor="true"
            style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                width: shape.width,
                height: shape.height,
                backgroundColor: shape.isHovering ? CURSOR_CONFIG.HOVER_COLOR : CURSOR_CONFIG.COLOR,
                borderRadius: shape.borderRadius,
                transform: isDragging 
                    ? "translate(-50%, -50%) scale(0.5)" 
                    : "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 9999,
                transition: "background-color 0.2s ease, opacity 0.3s ease, transform 0.3s ease",
                // Fade out when dragging tools or cows
                opacity: isDragging ? 0 : 1,
                // Add a subtle shadow effect when hovering
                ...(shape.isHovering && !isDragging && {
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
                }),
            }}
        />
    );
}
