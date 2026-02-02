import { faker } from '@faker-js/faker';

import db from '@/db';
import { serviceProvider } from '@/models';

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

interface LatLng {
  latitude: number;
  longitude: number;
}

export const createServiceProvider = async (location: LatLng) => {
  try {
    const randomOrganization = await db.query.organization.findFirst({});

    if (!randomOrganization) {
      throw new Error('No organization found');
    }

    const fakeData = {
      name: faker.internet.username(),
      age: faker.number.int({ min: 18, max: 65 }),
      email: faker.internet.email(),
      phoneNumber: `98${Math.random().toString().slice(2, 11)}`,
      primaryAddress: faker.location.streetAddress(),
      password: faker.internet.password(),
      serviceType: randomOrganization.serviceCategory,
      isVerified: true,
      organizationId: randomOrganization.id,
      currentLocation: {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      },
      serviceStatus: 'available',
    };

    console.log('Fake data', fakeData);

    const createdServiceProvider = await db
      .insert(serviceProvider)
      .values({
        name: faker.internet.username(),
        age: faker.number.int({ min: 18, max: 65 }),
        email: faker.internet.email(),
        phoneNumber: parseInt(`98${Math.random().toString().slice(2, 11)}`),
        primaryAddress: faker.location.streetAddress(),
        password: faker.internet.password(),
        serviceType: randomOrganization.serviceCategory,
        isVerified: true,
        organizationId: randomOrganization.id,
        currentLocation: {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        },
        serviceStatus: 'available',
      })
      .returning({
        id: serviceProvider.id,
        currentLocation: serviceProvider.currentLocation,
        serviceStatus: serviceProvider.serviceStatus,
      });

    console.log('Randomly created Service Provider', createdServiceProvider[0]);

    return createdServiceProvider;
  } catch (error) {
    console.log('Error creating service provider:', error);
    throw error;
  }
};

export const createNearServiceProviders = async (destLocation: LatLng, count: number) => {
  const createdServiceProviders = [];
  for (let i = 0; i < count; i++) {
    const distance = 0.04 + Math.random() * 0.01;
    const angle = Math.random() * 2 * Math.PI;

    const serviceProvider = await createServiceProvider({
      latitude: destLocation.latitude + Math.sin(angle) * distance,
      longitude: destLocation.longitude + Math.cos(angle) * distance,
    });
    createdServiceProviders.push(serviceProvider);
  }
  return createdServiceProviders;
};
