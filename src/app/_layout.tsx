import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { BrandSplash, HeaderLogo, ToastHost } from '@/shared/components'

// Keep the native splash up until BrandSplash takes over (it calls SplashScreen.hide()).
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const scheme = useColorScheme()

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'TaxonWorks', headerTitle: () => <HeaderLogo /> }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
          <Stack.Screen
            name="connect"
            options={{ title: 'Connect to TaxonWorks', presentation: 'fullScreenModal', headerShown: false }}
          />
        </Stack>
        <ToastHost />
        <BrandSplash />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({ root: { flex: 1 } })
