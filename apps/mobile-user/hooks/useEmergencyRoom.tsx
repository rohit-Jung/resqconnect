import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { SocketEvents } from '@/constants/socket.constants';
import { socketManager } from '@/socket/socket-manager';

interface EmergencyRoomData {
  requestId: string;
  emergencyLocation: { latitude: number; longitude: number };
  emergencyType: string;
  providerId: string;
  userId?: string;
}

const ACTIVE_EMERGENCY_KEY = '@active_emergency';

export function useEmergencyRoom(userType: 'user' | 'provider') {
  const router = useRouter();

  useEffect(() => {
    const handleJoinedRoom = async (data: EmergencyRoomData) => {
      console.log(`✅ Joined emergency room: ${data.requestId}`);

      await AsyncStorage.setItem(
        ACTIVE_EMERGENCY_KEY,
        JSON.stringify({
          requestId: data.requestId,
          emergencyLocation: data.emergencyLocation,
          emergencyType: data.emergencyType,
          providerId: data.providerId,
          userId: data.userId,
          joinedAt: Date.now(),
        })
      );

      if (userType === 'user') {
        router.push({
          pathname: '/emergency-tracking',
          params: { requestId: data.requestId },
        });
      } else {
        router.push({
          pathname: '/emergency-tracking',
          params: { requestId: data.requestId },
        });
      }
    };

    socketManager.on(SocketEvents.JOINED_EMERGENCY_ROOM, handleJoinedRoom);

    return () => {
      socketManager.off(SocketEvents.JOINED_EMERGENCY_ROOM, handleJoinedRoom);
    };
  }, [userType, router]);
}

// Get active emergency from storage (useful on app restart)
export async function getActiveEmergency(): Promise<EmergencyRoomData | null> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_EMERGENCY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get active emergency:', error);
    return null;
  }
}

// Clear active emergency (call when emergency is completed/cancelled)
export async function clearActiveEmergency() {
  try {
    await AsyncStorage.removeItem(ACTIVE_EMERGENCY_KEY);
  } catch (error) {
    console.error('Failed to clear active emergency:', error);
  }
}
