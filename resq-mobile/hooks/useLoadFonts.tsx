import {
  ChauPhilomeneOne_400Regular,
  ChauPhilomeneOne_400Regular_Italic,
} from '@expo-google-fonts/chau-philomene-one';
import {
  Inter_100Thin,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

export function useLoadFonts() {
  return useFonts({
    ChauPhilomeneOne_400Regular,
    ChauPhilomeneOne_400Regular_Italic,
    Inter_100Thin,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
}
