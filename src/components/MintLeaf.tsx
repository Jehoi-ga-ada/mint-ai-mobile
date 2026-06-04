import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

interface MintLeafProps {
  size?: number;
  /** Show the AI sparkles next to the leaf. */
  sparkles?: boolean;
  /** Show the soft glow behind the leaf. */
  glow?: boolean;
}

/** The Mint brand mark — a mint leaf with midrib + veins in the brand green.
 * Matches the app icon. Rendered with react-native-svg so it can be animated. */
export function MintLeaf({ size = 160, sparkles = true, glow = true }: MintLeafProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="mintLeafFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6BEFB5" />
          <Stop offset="1" stopColor="#1E9E69" />
        </LinearGradient>
        <RadialGradient id="mintLeafGlow" cx="50%" cy="48%" r="50%">
          <Stop offset="0" stopColor="#3DDC97" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#3DDC97" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {glow && <Circle cx="512" cy="500" r="440" fill="url(#mintLeafGlow)" />}

      <G transform="translate(512, 524) rotate(-18)">
        <Path
          d="M0 -300 C -210 -160 -210 160 0 300 C 210 160 210 -160 0 -300 Z"
          fill="url(#mintLeafFill)"
        />
        <G fill="none" stroke="#0E5A3C" strokeOpacity={0.5} strokeLinecap="round">
          <Path d="M0 -278 C -8 -100 -8 120 0 286" strokeWidth={16} />
          <Path d="M0 -150 Q -78 -178 -150 -150" strokeWidth={9} />
          <Path d="M0 -40 Q -88 -78 -168 -52" strokeWidth={9} />
          <Path d="M0 78 Q -80 56 -140 100" strokeWidth={9} />
          <Path d="M0 -150 Q 78 -178 150 -150" strokeWidth={9} />
          <Path d="M0 -40 Q 88 -78 168 -52" strokeWidth={9} />
          <Path d="M0 78 Q 80 56 140 100" strokeWidth={9} />
        </G>
        <Path
          d="M-12 -286 C -188 -150 -190 110 -70 268"
          fill="none"
          stroke="#CFF8E4"
          strokeOpacity={0.35}
          strokeWidth={14}
          strokeLinecap="round"
        />
      </G>

      {sparkles && (
        <>
          <Path
            d="M760 232 Q760 300 828 300 Q760 300 760 368 Q760 300 692 300 Q760 300 760 232 Z"
            fill="#7CF0BE"
          />
          <Path
            d="M846 320 Q846 356 882 356 Q846 356 846 392 Q846 356 810 356 Q846 356 846 320 Z"
            fill="#3DDC97"
            fillOpacity={0.85}
          />
        </>
      )}
    </Svg>
  );
}
