import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

const LOGO = require('@assets/images/logo/taxonworks_logo-full.svg')
const LOGO_ASPECT = 1103.52 / 200
const VISIBLE_MS = 1200
const FADE_MS = 350

/**
 * Branded splash rendered in JS, on top of the app, right after the native splash.
 * The native splash (configured in app.json) can only show a centered image, so the
 * full wordmark and the "Built by" footer are drawn here, then faded out.
 */
export function BrandSplash() {
  const [done, setDone] = useState(false)
  const opacity = useSharedValue(1)
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }))
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const logoWidth = Math.min(width * 0.7, 360)

  useEffect(() => {
    opacity.set(
      withDelay(
        VISIBLE_MS,
        withTiming(0, { duration: FADE_MS }, (finished) => {
          if (finished) scheduleOnRN(setDone, true)
        }),
      ),
    )
  }, [opacity])

  if (done) return null

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, fadeStyle]}
      onLayout={() => SplashScreen.hide()}
      pointerEvents="none"
    >
      <Image
        source={LOGO}
        style={{ width: logoWidth, height: logoWidth / LOGO_ASPECT }}
        contentFit="contain"
        accessibilityLabel="TaxonWorks"
      />
      <Text style={[styles.footer, { bottom: insets.bottom + 24 }]}>Built by SpeciesFileGroup</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  footer: {
    position: 'absolute',
    fontSize: 13,
    letterSpacing: 0.3,
    color: '#6b6560',
  },
})
