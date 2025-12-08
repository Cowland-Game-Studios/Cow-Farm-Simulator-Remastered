/**
 * InventorySidebar - Left sidebar showing inventory items
 * Allows selecting ingredients to place on the crafting board
 */

import React, { MouseEvent } from 'react';
import Button from '../../../components/button/button';
import styles from '../crafting.module.css';
import { PRODUCTS } from '../craftingUtils';
import { Inventory } from '../../../engine/types';

export interface SelectedIngredient {
    name: string;
    image: string;
}

interface InventorySidebarProps {
    inventory: Inventory;
    isClosing: boolean;
    onSelectIngredient: (ingredient: SelectedIngredient) => void;
    onStopPropagation: (e: MouseEvent) => void;
}

export default function InventorySidebar({
    inventory,
    isClosing,
    onSelectIngredient,
    onStopPropagation,
}: InventorySidebarProps): React.ReactElement {
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
            className={`${styles.standardedizedList} ${styles.leftSidebar} ${isClosing ? styles.closing : ''}`}
            onClick={onStopPropagation}
        >
            <div className={styles.list}>
                {PRODUCTS.map(product => {
                    const itemCount = inventory[product.id] || 0;
                    const hasItem = itemCount > 0;
                    return (
                        <div 
                            key={product.id}
                            className={`${styles.ingredientItem} ${!hasItem ? styles.ingredientDisabled : ''}`}
                            data-cursor-target="true"
                            data-item-id={product.id}
                            style={{
                                cursor: hasItem ? 'pointer' : 'not-allowed',
                            }}
                        >
                            <Button
                                text={`x${itemCount}`}
                                image={product.image}
                                disabled={!hasItem}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (hasItem) {
                                        onSelectIngredient({ 
                                            name: product.id, 
                                            image: product.image 
                                        });
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

