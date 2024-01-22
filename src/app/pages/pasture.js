import Image from "next/image";
import styles from "./pasture.module.css";
import Dock from "../components/dock/dock";
import Button from "../components/button/button";

export default function Pasture() {
    return (
        <main className={styles.pasture}>
            <Dock style={{top: 25}}>
                <Button text="10,000" image={"./images/buttons/coinIcon.svg"}/>
                <Button text="5.2/10k" image={"./images/buttons/starIcon.svg"}/>
            </Dock>
            <Dock style={{bottom: 25}}>
                <Button text="quest" image={"./images/buttons/questIcon.svg"}/>
                <Button text="collect" image={"./images/buttons/bucketIcon.svg"}/>
                <Button text="feed" image={"./images/buttons/grassIcon.svg"}/>
                <Button text="make" image={"./images/buttons/milkIcon.svg"}/>
                <Button text="shop" image={"./images/buttons/shopIcon.svg"}/>
            </Dock>
        </main>
    );
}
