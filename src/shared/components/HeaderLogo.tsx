import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'

import { useAppTheme } from './theme'

const SYMBOL = {
  light: require('@assets/images/logo/taxonworks-black-circle.svg'),
  dark: require('@assets/images/logo/taxonworks-white-circle.svg'),
}
const WORDMARK = {
  light: require('@assets/images/logo/taxonworks-black.svg'),
  dark: require('@assets/images/logo/taxonworks-white.svg'),
}

const SYMBOL_SIZE = 24
const WORDMARK_HEIGHT = SYMBOL_SIZE * 0.7
const WORDMARK_ASPECT = 444 / 59

export function HeaderLogo() {
  const { dark } = useAppTheme()
  const mode = dark ? 'dark' : 'light'

  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="TaxonWorks">
      <Image source={SYMBOL[mode]} style={styles.symbol} contentFit="contain" />
      <Image source={WORDMARK[mode]} style={styles.wordmark} contentFit="contain" />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { width: SYMBOL_SIZE, height: SYMBOL_SIZE },
  wordmark: { height: WORDMARK_HEIGHT, width: WORDMARK_HEIGHT * WORDMARK_ASPECT },
})
