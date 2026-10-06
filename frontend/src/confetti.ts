// confetti.ts
// A short burst of confetti from the bottom corners of the screen (skipped when the user prefers reduced motion)

const COLORS = ["#074885", "#2f80ed", "#f2c94c", "#eb5757", "#27ae60", "#9b51e0"];
const PER_CORNER = 32;

const random = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Fires about a second of confetti up and inward from both bottom corners. It's decorative only: hidden from assistive
 * tech, never blocks clicks, and removes itself when the animation ends
 */
export const fireConfetti = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    Object.assign(container.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: "60"
    });
    document.body.appendChild(container);

    const height = window.innerHeight;
    const animations: Animation[] = [];

    for (const side of [1, -1]) {
        for (let i = 0; i < PER_CORNER; i++) {
            const piece = document.createElement("div");
            const width = random(6, 10);
            Object.assign(piece.style, {
                position: "absolute",
                bottom: "-12px",
                [side === 1 ? "left" : "right"]: "-6px",
                width: `${width}px`,
                height: `${width * random(1.2, 1.8)}px`,
                background: COLORS[Math.floor(Math.random() * COLORS.length)],
                borderRadius: Math.random() < 0.3 ? "50%" : "2px"
            });
            container.appendChild(piece);

            // launched 50-80 degrees above the horizontal, inward; it rises, then drifts down as it fades
            const angle = (random(50, 80) * Math.PI) / 180;
            const distance = height * random(0.35, 0.65);
            const dx = Math.cos(angle) * distance * side;
            const dy = -Math.sin(angle) * distance;
            const spin = random(-720, 720);

            animations.push(
                piece.animate(
                    [
                        { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
                        {
                            transform: `translate(${dx * 0.75}px, ${dy}px) rotate(${spin * 0.6}deg)`,
                            opacity: 1,
                            offset: 0.55
                        },
                        {
                            transform: `translate(${dx}px, ${dy + height * random(0.1, 0.25)}px) rotate(${spin}deg)`,
                            opacity: 0
                        }
                    ],
                    { duration: random(900, 1300), easing: "cubic-bezier(0.2, 0.7, 0.4, 1)", fill: "forwards" }
                )
            );
        }
    }

    Promise.allSettled(animations.map(animation => animation.finished)).then(() => container.remove());
};
