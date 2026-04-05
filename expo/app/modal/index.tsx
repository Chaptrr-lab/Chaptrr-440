import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOrFallback } from '@/lib/navigation';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 12 }}>
        Modal Screen (placeholder)
      </Text>

      <Text style={{ color: '#666', textAlign: 'center', marginBottom: 20 }}>
        This is a modal screen. You can add more content here later.
      </Text>

      <Button title="Close" onPress={() => goBackOrFallback(router, '/')} />
    </View>
  );
}
