import React, { ReactNode, CSSProperties } from 'react';
import styles from "./dock.module.css";

interface DockProps {
    /** Dock content (typically Button components) */
    children?: ReactNode;
    /** Custom inline styles for positioning */
    style?: CSSProperties;
    [key: string]: unknown;
}

export default function Dock({ children = null, style = {}, ...props }: DockProps): React.ReactElement {
    return (
        <div className={styles.dock} style={style} {...props}>
            <div className={styles.dockContainer}>
                {children}
            </div>
        </div>
    );
}

