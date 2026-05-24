import {
  ProfileInfoItem,
  ProfileScreenContent,
} from '@/components/ProfileScreen';
import { useAuthStore } from '@/store/authStore';

export default function UserProfileScreen() {
  const { user, updateProfilePicture, logout } = useAuthStore();

  const profileInfoItems: ProfileInfoItem[] = [
    {
      icon: 'person-outline',
      label: 'Username',
      value: user?.username || 'N/A',
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: 'call-outline',
      label: 'Phone Number',
      value: user?.phoneNumber?.toString() || 'Not set',
    },
    {
      icon: 'calendar-outline',
      label: 'Age',
      value: user?.age?.toString() || 'Not set',
    },
    {
      icon: 'location-outline',
      label: 'Primary Address',
      value: user?.primaryAddress || 'Not set',
    },
  ];

  const handleProfilePictureChange = (newUrl: string | null) => {
    updateProfilePicture(newUrl);
  };

  return (
    <ProfileScreenContent
      name={user?.name || 'User'}
      email={user?.email || ''}
      role={user?.role}
      profilePicture={user?.profilePicture}
      profileInfoItems={profileInfoItems}
      onLogout={logout}
      onProfilePictureChange={handleProfilePictureChange}
    />
  );
}
