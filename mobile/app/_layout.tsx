import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();

  const RootLayoutInner = () => {
    const { user, loading } = useAuth();

    useEffect(() => {
      if (loaded && !loading) {
        SplashScreen.hideAsync();
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }
    }, [loaded, loading, user]);

    if (!loaded || loading) {
      return null;
    }

    return (
      <Stack screenOptions={{ headerShown: false }}>
        {!user && <Stack.Screen name="login" />}
        {user && <Stack.Screen name="(tabs)" />}
      </Stack>
    );
  };

  return (
    <AuthProvider>
      <RootLayoutInner />
      <StatusBar />
    </AuthProvider>
  );
}