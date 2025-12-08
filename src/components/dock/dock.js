import PropTypes from 'prop-types';
import styles from "./dock.module.css";

export default function Dock ({ children = null, style = {}, ...props }) {
    return (
        <div className={styles.dock} style={style} {...props}>
            <div className={styles.dockContainer}>
                {children}
            </div>
        </div>
    );
}

Dock.propTypes = {
    /** Dock content (typically Button components) */
    children: PropTypes.node,
    /** Custom inline styles for positioning */
    style: PropTypes.object,
};
