import { useState } from "react";
import Button from "../components/button/button";
import styles from "./crafting.module.css";
import Draggable from "../components/draggable/draggable";

const products = [
    {
        name: "milk",
        image: "./images/crafting/products/milk.svg",
    },
    {
        name: "cream",
        image: "./images/crafting/products/cream.svg",
    },
    {
        name: "butter",
        image: "./images/crafting/products/butter.svg",
    },
    {
        name: "cheesecake",
        image: "./images/crafting/products/cheesecake.svg",
    },
    {
        name: "yogurt",
        image: "./images/crafting/products/yogurt.svg",
    },
    {
        name: "ice cream",
        image: "./images/crafting/products/ice cream.svg",
    },
]

const craftingRecipies = [
    {
        time: 60,
        inputs: [
            {
                name: "milk",
                amount: 1,
            }
        ],
        outputs: [
            {
                name: "cream",
                amount: 1,
            }
        ]
    },
    {
        time: 60,
        inputs: [
            {
                name: "milk",
                amount: 1,
            }
        ],
        outputs: [
            {
                name: "butter",
                amount: 1,
            }
        ]
    },
    {
        time: 60,
        inputs: [
            {
                name: "milk",
                amount: 1,
            }
        ],
        outputs: [
            {
                name: "yogurt",
                amount: 1,
            }
        ]
    },
]

function CraftingItem({time = 60, inputs = [], outputs = [], enabled = false}) {
    return (
    <div style={{ textAlign: "center", opacity: enabled ? 1 : 0.25}}>
        <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
            <img style={{ width: 10 }} src="./images/crafting/time.svg" />
            <p style={{ color: "black", marginTop: 5 }}>10 min</p>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center" }}>
            <div>
                <img src="./images/crafting/products/milk.svg" />
                <p style={{  color: "black", marginTop: 0 }}>2x</p>
            </div>
            <p style={{ color: "black", fontSize: 20, marginTop: -20 }}>=</p>
            <div>
                <img src="./images/crafting/products/milk.svg" />
                <p style={{  color: "black", marginTop: 0 }}>2x</p>
            </div>
        </div>
    </div>
    )
}

export default function Crafting({onClose = () => {}}) {

    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientsPlaced, setIngredientsPlaced] = useState([]);
    // const [canPlaceIngredient, setCanPlaceIngredient] = useState(false);

    return (
        // onClick={onClose}
        <div className={styles.craftingBlurBackground} >

            {selectedIngredient && <Draggable id="ingredient" initialDragging onDrop={({x, y}) => {
                setSelectedIngredient(null);

                // if (canPlaceIngredient) {

                    // const xRelativeToTable = x - document.getElementById("craftingBench").getBoundingClientRect().left;
                    // const yRelativeToTable = y - document.getElementById("craftingBench").getBoundingClientRect().top;

                    setIngredientsPlaced([...ingredientsPlaced, {name: selectedIngredient.name, image: selectedIngredient.image, x, y}]);
                // }
            }} trackRotationSettings={{rotates: false}}>
                {/* <div> */}
                    <img draggable={false} src={selectedIngredient.image}/>
                {/* </div> */}
            </Draggable>}

            {
                ingredientsPlaced.map(ingredient => {
                    return (
                        <a style={{
                            position: "absolute",
                            left: ingredient.x,
                            top: ingredient.y,
                            transform: "translate(-50%, -50%)",
                            zIndex: 2
                        }} onMouseDown={() => {
                            //find this current ingredient with this coordinates and remove it from the list
                            setIngredientsPlaced(ingredientsPlaced.filter(ing => ing.x !== ingredient.x && ing.y !== ingredient.y));
                            setSelectedIngredient({name: ingredient.name, image: ingredient.image});
                        }}>
                            <img draggable={false} src={ingredient.image}/>
                        </a>
                    )
                })
            }

            <div className={styles.spreadEvenlyContainer}>
                <div className={styles.standardedizedList}>
                    <div style={{marginLeft: "50%"}}>
                        <div className={styles.list}>
                            {
                                products.map(product => {
                                    return (
                                        <Button key={product.name} text={"x100"} image={product.image} onMouseDown={() => {
                                            console.log(product.name);
                                            setSelectedIngredient({name: product.name, image: product.image});
                                        }}/>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className={styles.benchTop} id="craftingBench" 
                // onMouseEnter={() => {
                //     setCanPlaceIngredient(true);
                // }}
                // onMouseLeave={() => {
                //     setCanPlaceIngredient(false);
                // }}
                >
                    <img draggable={false} className={styles.craftingInstructions} src="./images/crafting/instruction.svg" />
                </div>
                <div className={styles.standardedizedList}>
                    <div className={styles.list}>
                        <CraftingItem enabled/>
                        <CraftingItem />
                        <CraftingItem />
                    </div>
                </div>
            </div>

            <div className={styles.buttonContainers}>
                <div className={styles.casualButton} onClick={() => {
                    setIngredientsPlaced([]);
                }}>
                    <p className={styles.casualButtonText}>clear</p>
                </div>
                <div className={styles.casualButton} onClick={onClose}>
                    <p className={styles.casualButtonText} style={{color: "red"}}>cancel & close</p>
                </div>
            </div>
        </div>
    )
}