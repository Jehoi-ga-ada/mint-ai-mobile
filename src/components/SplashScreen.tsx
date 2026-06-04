import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors, typography } from '../theme';
import { MintLeaf } from './MintLeaf';

interface SplashScreenProps {
  /** True once the app has finished hydrating and the real UI is ready. */
  ready: boolean;
  /** Called after the exit animation completes, to unmount the splash. */
  onFinish: () => void;
}

// Keep the splash up at least this long so the intro animation is always seen,
// even when hydration is instant.
const MIN_VISIBLE_MS = 1100;
const EXIT_MS = 380;

/** Animated brand splash shown over the app while it hydrates: the mint leaf
 * springs in with the wordmark, then the whole overlay fades out to reveal the
 * app. Pure JS (Animated, native driver) layered over the dark launch screen. */
export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const intro = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const [minElapsed, setMinElapsed] = useState(false);
  const exiting = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(intro, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 420, delay: 240, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [intro, word]);

  useEffect(() => {
    if (ready && minElapsed && !exiting.current) {
      exiting.current = true;
      Animated.timing(out, { toValue: 1, duration: EXIT_MS, useNativeDriver: true }).start(
        () => onFinish(),
      );
    }
  }, [ready, minElapsed, onFinish, out]);

  const containerOpacity = out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const leafScale = intro.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const wordTranslate = word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.fill, { opacity: containerOpacity }]}
      pointerEvents={exiting.current ? 'none' : 'auto'}
    >
      <Animated.View style={{ opacity: intro, transform: [{ scale: leafScale }] }}>
        <MintLeaf size={172} />
      </Animated.View>
      <Animated.Text
        style={[styles.word, { opacity: word, transform: [{ translateY: wordTranslate }] }]}
      >
        Mint
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  word: { ...typography.display, color: colors.text, letterSpacing: 0.5 },
});
