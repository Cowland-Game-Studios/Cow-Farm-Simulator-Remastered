/**
 * CSS Module type declarations
 * Allows importing CSS modules with type safety
 */

declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}

declare module '*.css' {
    const content: string;
    export default content;
}

/**
 * Image type declarations
 */
declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}

/**
 * Audio type declarations
 */
declare module '*.wav' {
    const content: string;
    export default content;
}

declare module '*.mp3' {
    const content: string;
    export default content;
}

