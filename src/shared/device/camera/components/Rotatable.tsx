import { createContext, type ReactNode, use, useEffect } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { nearestRotation } from '../utils/rotation'

/**
 * Degrees the camera controls must turn to look upright. The camera screen stays portrait, but the
 * phone may be held sideways (the camera reports how: `onUIRotationChanged`).
 */
export const UIRotationContext = createContext(0)

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> }

export function Rotatable({ children, style }: Props) {
  const target = use(UIRotationContext)
  const angle = useSharedValue(target)

  useEffect(() => {
    angle.set(withTiming(nearestRotation(angle.get(), target), { duration: 250 }))
  }, [angle, target])

  const animated = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.get()}deg` }],
  }))

  return <Animated.View style={[style, animated]}>{children}</Animated.View>
}
