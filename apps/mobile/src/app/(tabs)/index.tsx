import { View, Text } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';

export default function PasswordScreen() {
  return (
    <View className='flex flex-1 items-center justify-center'>
      <Text className='font-bold text-2xl'>Password</Text>
      <Button onPress={() => console.log('Button pressed')}>
        <ButtonText>Button</ButtonText>
      </Button>
    </View>
  );
} 
