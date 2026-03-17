import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

export default function Index() {
  const [target, setTarget] = useState<'/(tabs)/explore' | '/onboarding' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then(val => {
      setTarget(val === 'true' ? '/(tabs)/explore' : '/onboarding');
    });
  }, []);

  if (!target) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  return <Redirect href={target} />;
}
