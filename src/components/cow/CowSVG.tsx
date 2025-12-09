import React from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';

interface CowSVGProps {
    color?: string;
    fullness?: number;
    pollInterval?: number;
}

// Regular cow - colored fill with black outline, with fullness-based fill animation
export function CowSVG({ color = "white", fullness = 0, pollInterval = 1000 }: CowSVGProps): React.ReactElement {
    // The cow body occupies roughly y=27% to y=70% of the SVG
    // We use a clip-path approach: as fullness increases, we reveal more of the colored cow from bottom to top
    // clipY represents where the "fill line" is - at fullness=0, it's at maxY (bottom of body visible)
    // at fullness=1, it's at minY (entire body visible)
    const { BODY_CLIP_MIN_Y: minY, BODY_CLIP_MAX_Y: maxY } = GAME_CONFIG.COW;
    const clipY = maxY - (fullness * (maxY - minY)); // Goes from maxY to minY as fullness goes 0 to 1

    return (
        <div style={{ position: 'relative', width: 100, height: 100 }}>
            {/* Base layer: White/unfilled cow */}
            <svg 
                width="100" 
                height="100" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                <path d="M8.64197 45.679L11.7284 40.7407L17.2839 33.3333L20.1106 32.5L22.5 33.3333L24.6914 34.5679L44.4444 32.0988L78.75 32.5L83.3333 34.5679L87.5 38.75L88.8889 45.0617L88.75 55L82.0988 58.642V60.4938V64.1975L80.8642 76.5432L79.6296 78.395H77.7778L75.9259 77.7778L75.4349 77.5H73.75L72.2222 77.1605L71.25 75L73.75 63.75L71.6049 59.2592L67.5 61.25L58.642 62.3457L50 61.7284L45.679 61.25V70.3704L45.3944 76.25L44.4444 77.7778L41.9753 78.395L40.7407 77.7778L38.75 78.75L35.9225 77.5L36.4197 72.8395L37.5 67.5L35.8025 63.5802L35 63.75L32.0988 62.9629L29.6296 61.1111L27.5 53.75L25.3086 51.25L22.5 50L17.2839 51.2346L11.25 51.25L8.74998 48.75L8.64197 45.679Z" fill="white" />

                <path d="M45.0618 56.1728L45.5663 75.703C45.6098 77.0784 44.6697 78.2721 43.3557 78.5084L42.9359 78.5833C42.2114 78.7137 41.5201 78.5381 40.9674 78.1608" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M81.3727 45.7455C82.697 48.5697 83.1495 53.4452 82.1733 57.4565L82.431 64.7073L81.0462 75.8243C80.8982 77.0063 80.0334 77.9511 78.8964 78.1721L78.5446 78.2405C77.5961 78.4249 76.6956 78.0787 76.0868 77.4357" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M82.0988 57.4074L80.2802 65.7289L76.7996 76.3775C76.4288 77.5094 75.3996 78.2719 74.2413 78.2719H73.883C72.0469 78.2719 70.7469 76.4247 71.3163 74.6233L73.5746 64.9192C73.5746 64.9192 67.8344 54.2789 69.4094 49.3469" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M49.65 61.8069C49.65 61.8069 66.45 63.6278 71.0083 59.8069M90.5556 61.6417C90.5556 61.6417 87.5445 56.5486 88.8333 48.7972C90.4945 34.2806 77.0042 32.2111 79.8806 32.9L79.4083 32.7181L47.1903 31.9069C45.8986 31.8736 44.607 31.9278 43.3236 32.0681L32.3361 33.2653M10.8195 30.9306C13.5833 34.4542 16.35 34.4542 16.35 34.4542" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M26.3542 28.7431C28.3236 32.6917 23.9403 34.7181 23.9403 34.7181C23.9403 34.7181 20.1667 29.4708 16.35 34.4542L13.4875 37.9264C13.4875 37.9264 10.5556 42.7458 8.5014 45.5125C7.93056 46.2819 8.95973 48.8805 9.45417 49.7055C10.3708 51.2403 16.8875 52.1861 22.9583 50C22.9583 50 28.0208 50.4542 28.9722 59.8056C29.1542 61.5847 32.775 63.9958 35.7556 63.6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M43.125 44.2542L45.2514 55.5847L41.7292 76.5945C41.557 77.9597 40.4417 78.9917 39.107 79.0195L38.6806 79.0278C36.8292 79.0667 35.4889 77.2264 36.0528 75.407C37.2 71.707 37.4167 65.725 35.7181 61.6417C33.7764 56.9778 34.6723 54.7542 34.6723 54.7542" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M25.9083 43.7569C32.5139 45.9139 32.8458 40.3431 32.8458 40.3431V39.9847C29.6319 36.1514 26.6569 38.9056 26.6569 38.9056" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Top layer: Colored/filled cow with clip-path that reveals from bottom up */}
            <svg 
                width="100" 
                height="100" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0,
                    clipPath: `inset(${clipY}% 0 0 0)`,
                    transition: `clip-path ${pollInterval / 1000}s ease-in-out`,
                }}
            >
                <path d="M8.64197 45.679L11.7284 40.7407L17.2839 33.3333L20.1106 32.5L22.5 33.3333L24.6914 34.5679L44.4444 32.0988L78.75 32.5L83.3333 34.5679L87.5 38.75L88.8889 45.0617L88.75 55L82.0988 58.642V60.4938V64.1975L80.8642 76.5432L79.6296 78.395H77.7778L75.9259 77.7778L75.4349 77.5H73.75L72.2222 77.1605L71.25 75L73.75 63.75L71.6049 59.2592L67.5 61.25L58.642 62.3457L50 61.7284L45.679 61.25V70.3704L45.3944 76.25L44.4444 77.7778L41.9753 78.395L40.7407 77.7778L38.75 78.75L35.9225 77.5L36.4197 72.8395L37.5 67.5L35.8025 63.5802L35 63.75L32.0988 62.9629L29.6296 61.1111L27.5 53.75L25.3086 51.25L22.5 50L17.2839 51.2346L11.25 51.25L8.74998 48.75L8.64197 45.679Z" fill={color} />

                <path d="M45.0618 56.1728L45.5663 75.703C45.6098 77.0784 44.6697 78.2721 43.3557 78.5084L42.9359 78.5833C42.2114 78.7137 41.5201 78.5381 40.9674 78.1608" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M81.3727 45.7455C82.697 48.5697 83.1495 53.4452 82.1733 57.4565L82.431 64.7073L81.0462 75.8243C80.8982 77.0063 80.0334 77.9511 78.8964 78.1721L78.5446 78.2405C77.5961 78.4249 76.6956 78.0787 76.0868 77.4357" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M82.0988 57.4074L80.2802 65.7289L76.7996 76.3775C76.4288 77.5094 75.3996 78.2719 74.2413 78.2719H73.883C72.0469 78.2719 70.7469 76.4247 71.3163 74.6233L73.5746 64.9192C73.5746 64.9192 67.8344 54.2789 69.4094 49.3469" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M49.65 61.8069C49.65 61.8069 66.45 63.6278 71.0083 59.8069M90.5556 61.6417C90.5556 61.6417 87.5445 56.5486 88.8333 48.7972C90.4945 34.2806 77.0042 32.2111 79.8806 32.9L79.4083 32.7181L47.1903 31.9069C45.8986 31.8736 44.607 31.9278 43.3236 32.0681L32.3361 33.2653M10.8195 30.9306C13.5833 34.4542 16.35 34.4542 16.35 34.4542" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M26.3542 28.7431C28.3236 32.6917 23.9403 34.7181 23.9403 34.7181C23.9403 34.7181 20.1667 29.4708 16.35 34.4542L13.4875 37.9264C13.4875 37.9264 10.5556 42.7458 8.5014 45.5125C7.93056 46.2819 8.95973 48.8805 9.45417 49.7055C10.3708 51.2403 16.8875 52.1861 22.9583 50C22.9583 50 28.0208 50.4542 28.9722 59.8056C29.1542 61.5847 32.775 63.9958 35.7556 63.6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M43.125 44.2542L45.2514 55.5847L41.7292 76.5945C41.557 77.9597 40.4417 78.9917 39.107 79.0195L38.6806 79.0278C36.8292 79.0667 35.4889 77.2264 36.0528 75.407C37.2 71.707 37.4167 65.725 35.7181 61.6417C33.7764 56.9778 34.6723 54.7542 34.6723 54.7542" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M25.9083 43.7569C32.5139 45.9139 32.8458 40.3431 32.8458 40.3431V39.9847C29.6319 36.1514 26.6569 38.9056 26.6569 38.9056" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

interface CowToMilkSVGProps {
    color?: string;
}

// Ready to milk cow - colored fill with black outline, udder visible
// Matches public/images/cows/cowToMilk.svg
export function CowToMilkSVG({ color = "white" }: CowToMilkSVGProps): React.ReactElement {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 14.5L29 27L30 31.5L37 33L43.5 32L46.5 35L48.5 40.5L44 44C42.4147 44.0694 41.3004 44.315 38.5 45.5L30.5 49.5L29 52L30 54L29 56.5L30.5 59L34 59L38 57.5L38 60L39.5 61.5L38.5 64.5L34.5 65L34 67.5L35.5 69L38.5 69L39.5 72L37.5 74L37.5 76L39.5 76.5L42.5 75L48.5 77L36.5 79L35.5 82.5L39 84L49 80.5L42 82.5L41 85L42 87L55 87.5C58.1667 87 64.7 85.9 65.5 85.5C66.3 85.1 68.8333 82.3333 70 81L74 70.5L75.5 44C75.08 39.25 74.4927 36.6068 71.5 32L58 19.5C54.8305 17.2152 52.0052 16.5421 45 16.5L40 14.5Z" fill={color}/>
            <path d="M48.0566 76.8718L38.1877 78.2412C36.3019 78.3551 35.0432 80.2308 35.7012 81.9449L35.8296 82.2794C36.2447 83.3608 37.3254 84.0484 38.5151 83.9889L40.5 83.8884" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M74 71.2626L75.2951 45.5483C75.3285 44.2566 75.2743 42.965 75.134 41.6816" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M30.0227 53.6538L29.7835 53.3007C28.7425 51.7692 29.5559 49.6429 31.3889 49.1249C33.6035 48.4993 36.3146 47.1597 38.6748 45.4104" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M59.008 43.4062L52.745 50.507L33.2065 58.9957C31.9677 59.5948 30.4948 59.2215 29.7446 58.1172L29.5054 57.7642C28.4644 56.2327 29.2779 54.1063 31.1109 53.5883C34.8388 52.5353 39.9736 49.459 42.4731 45.8105C45.327 41.642 47.6798 41.1822 47.6798 41.1822" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M48.0524 11.0197C49.7416 15.0961 45.2275 16.8117 45.2275 16.8117C45.2275 16.8117 41.8292 11.3141 37.6742 16.019L34.5764 19.2831C34.5764 19.2831 31.3154 23.8863 29.0733 26.5029C28.4502 27.2307 29.2956 29.8947 29.7313 30.7522C30.5386 32.3472 36.9734 33.7453 43.182 31.988C43.182 31.988 47.723 32.7175 48.4213 40.8751" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M32.4029 12.1182C34.9142 15.8261 37.6742 16.019 37.6742 16.019" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M42.3431 22.361C42.6966 29.3008 48.0164 27.6143 48.0164 27.6143L48.3509 27.4859C50.7779 23.1117 47.1405 21.3213 47.1405 21.3213" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M71.2493 75.6418C71.6918 84.0834 63.5767 87.4786 54.7037 87.1848L43.5151 87.7516C42.3254 87.811 41.2447 87.1235 40.8296 86.0421L40.7012 85.7075C40.0432 83.9934 41.3019 82.1177 43.1877 82.0038L53.0566 80.6345C53.0566 80.6345 60.933 71.4623 66.1018 71.1653" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M48 56.7626C46 56.7626 44 57.3626 42.5 58.4626L40 57.0626C39.5582 56.8938 39.0709 56.8869 38.6246 57.0433C38.1783 57.1996 37.8018 57.5091 37.562 57.9168C37.3222 58.3244 37.2346 58.8038 37.3148 59.2699C37.395 59.736 37.6378 60.1586 38 60.4626L39.6 61.3626C39 62.3626 38.5 63.4626 38.2 64.7626H36C35.4696 64.7626 34.9608 64.9733 34.5858 65.3484C34.2107 65.7235 34 66.2322 34 66.7626C34 67.2931 34.2107 67.8018 34.5858 68.1768C34.9608 68.5519 35.4696 68.7626 36 68.7626H38.2C38.413 69.9845 38.8908 71.145 39.6 72.1626L38 73.0626C37.5491 73.3279 37.2221 73.7613 37.0908 74.2677C36.9595 74.774 37.0348 75.3118 37.3 75.7626C37.5652 76.2135 37.9987 76.5405 38.505 76.6718C39.0114 76.8031 39.5491 76.7279 40 76.4626L42.5 75.0626C44 76.1626 46 76.7626 48 76.7626" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M71.8871 32.3778C71.8871 32.3778 63.7022 23.15 58 19.5839" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

interface CowMilkedSVGProps {
    color?: string;
}

// Milked/hungry cow - white fill with 25% opacity colored outline
// Matches public/images/cows/cowMilked.svg
export function CowMilkedSVG({ color = "black" }: CowMilkedSVGProps): React.ReactElement {
    // Extract RGB values and set to 25% opacity
    const getStrokeColor = (): string => {
        if (color.includes("rgba")) {
            // Replace the opacity value with 0.25
            return color.replace(/,\s*[\d.]+\)$/, ", 0.25)");
        } else if (color.includes("rgb")) {
            // Convert rgb to rgba with 0.25 opacity
            return color.replace("rgb", "rgba").replace(")", ", 0.25)");
        } else {
            // For hex or named colors, just return with opacity
            return color;
        }
    };

    const strokeColor = getStrokeColor();

    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8147 59.6075L16.7325 59.189C16.3727 57.3725 17.9522 55.733 19.842 55.9724C22.1249 56.2619 25.1439 56.0881 28 55.4" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M49.65 61.8069C49.65 61.8069 61.9737 62.3293 68.5 60.7047M90.5556 61.6417C90.5556 61.6417 87.5445 56.5486 88.8333 48.7972C90.4945 34.2805 77.0042 32.2111 79.8806 32.9L79.4083 32.718L47.1903 31.9069C45.8986 31.8736 44.607 31.9278 43.3236 32.068L32.3361 33.2653M10.8195 30.9305C13.5833 34.4542 16.35 34.4542 16.35 34.4542" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M26.3542 28.743C28.3236 32.6917 23.9403 34.718 23.9403 34.718C23.9403 34.718 20.1667 29.4708 16.35 34.4542L13.4875 37.9264C13.4875 37.9264 10.5556 42.7458 8.5014 45.5125C7.93056 46.2819 8.95973 48.8805 9.45417 49.7055C10.3708 51.2403 16.8875 52.1861 22.9583 50C22.9583 50 27.5391 50.4109 28.8048 58.5" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M47.5 61.5L38.9604 65.5892L17.6582 65.7687C16.2838 65.8362 15.0738 64.9171 14.8147 63.6074L14.7325 63.189C14.3727 61.3725 15.9523 59.733 17.842 59.9724C21.685 60.4597 27.6137 59.6343 31.34 57.2524C35.5959 54.5304 37.9413 55.0265 37.9413 55.0265" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21.4499 40.455C22.2866 47.3532 27.4758 45.2997 27.4758 45.2997L27.8006 45.1483C29.9165 40.6155 26.1631 39.0832 26.1631 39.0832" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M88.5 57C88.5 65.4531 80.2184 68.419 71.3729 67.6612L60.1699 67.6416C58.9788 67.6388 57.9356 66.8956 57.5777 65.7939L57.4669 65.4531C56.8995 63.7069 58.2546 61.8997 60.1438 61.8846L70.0709 61.0337C70.0709 61.0337 78.4165 52.2863 83.5938 52.2602" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

