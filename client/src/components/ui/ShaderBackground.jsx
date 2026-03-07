import { MeshGradient, DotOrbit } from "@paper-design/shaders-react"

// Color palettes matched to the app's theme design tokens
const DARK_PALETTE = ["#0f0f1a", "#1a1a2e", "#252542", "#6c5ce7"]
const LIGHT_PALETTE = ["#f8f9fc", "#eef0f6", "#dcd6f7", "#6c5ce7"]

export default function ShaderBackground({
    speed = 1.0,
    intensity = 1.5,
    activeEffect = "mesh",
    isDark = false,
}) {
    const colors = isDark ? DARK_PALETTE : LIGHT_PALETTE
    const bg = isDark ? "#0f0f1a" : "#f8f9fc"
    const glowColor1 = isDark
        ? "rgba(108, 92, 231, 0.08)"
        : "rgba(108, 92, 231, 0.14)"
    const glowColor2 = isDark
        ? "rgba(236, 72, 153, 0.05)"
        : "rgba(168, 85, 247, 0.10)"
    const dotColor = isDark ? "#6c5ce7" : "#a855f7"
    const orbitColor = isDark ? "#252542" : "#dcd6f7"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
                background: bg,
                overflow: "hidden",
                zIndex: 0,
                transition: "background 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
        >
            {/* Mesh Gradient Effect */}
            {activeEffect === "mesh" && (
                <MeshGradient
                    style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                    colors={colors}
                    speed={speed}
                    backgroundColor={bg}
                />
            )}

            {/* Dot Orbit Effect */}
            {activeEffect === "dots" && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        inset: 0,
                        background: bg,
                    }}
                >
                    <DotOrbit
                        style={{ width: "100%", height: "100%" }}
                        dotColor={dotColor}
                        orbitColor={orbitColor}
                        speed={speed}
                        intensity={intensity}
                    />
                </div>
            )}

            {/* Combined Effect */}
            {activeEffect === "combined" && (
                <>
                    <MeshGradient
                        style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                        colors={colors}
                        speed={speed * 0.5}
                        backgroundColor={bg}
                    />
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            inset: 0,
                            opacity: 0.6,
                        }}
                    >
                        <DotOrbit
                            style={{ width: "100%", height: "100%" }}
                            dotColor={dotColor}
                            orbitColor={orbitColor}
                            speed={speed * 1.5}
                            intensity={intensity * 0.8}
                        />
                    </div>
                </>
            )}

            {/* Ambient glow overlays */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <div
                    style={{
                        position: "absolute",
                        top: "25%",
                        left: "33%",
                        width: "8rem",
                        height: "8rem",
                        background: glowColor1,
                        borderRadius: "50%",
                        filter: "blur(3rem)",
                        animation: `pulse-glow ${3 / speed}s ease-in-out infinite`,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "33%",
                        right: "25%",
                        width: "6rem",
                        height: "6rem",
                        background: glowColor2,
                        borderRadius: "50%",
                        filter: "blur(2rem)",
                        animation: `pulse-glow ${2 / speed}s ease-in-out infinite`,
                        animationDelay: "1s",
                    }}
                />
            </div>
        </div>
    )
}
