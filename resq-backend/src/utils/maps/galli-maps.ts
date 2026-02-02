import axios from 'axios';

import { envConfig } from '@/config/env.config';

const MAPS_ACCESS_TOKEN = envConfig.galli_maps_token;
const BASE_API = `https://route-init.gallimap.com/api/v1`;

interface IAutoCompleteProps {
  searchQuery: string;
  currentLat: string;
  currentLong: string;
}

interface IRoutingProps {
  srcLat: string;
  srcLng: string;
  dstLat: string;
  dstLng: string;
  mode?: 'DRIVING' | 'WALKING' | 'CYCLING';
}

const compeletAutoSearch = async ({ searchQuery, currentLat, currentLong }: IAutoCompleteProps) => {
  try {
    if (searchQuery.length < 4) {
      return null;
    }

    const response = await axios.get(`${BASE_API}/search/autocomplete`, {
      params: {
        accessToken: MAPS_ACCESS_TOKEN,
        word: searchQuery,
        lat: currentLat,
        lng: currentLong,
      },
    });
    console.log('response from galli maps', response);

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.log('Error while fetching maps autocomplete data', error);
    return null;
  }
};

const getOptimalRoute = async ({
  srcLat,
  srcLng,
  dstLat,
  dstLng,
  mode = 'DRIVING',
}: IRoutingProps) => {
  try {
    console.log('srcLat, srcLng, dstLat, dstLng', srcLat, srcLng, dstLat, dstLng);

    const response = await axios.get(`${BASE_API}/routing`, {
      params: {
        accessToken: MAPS_ACCESS_TOKEN,
        srcLat,
        srcLng,
        dstLat,
        dstLng,
        mode,
      },
    });

    if (response.data.success) {
      return response.data.data.data;
    }

    return null;
  } catch (error) {
    console.log('Error while fetching maps routing data', error);
    return null;
  }
};

const reverseGeoCode = async (lat: string, lng: string) => {
  console.log('lat, lng', lat, lng);

  try {
    const response = await axios.get(`${BASE_API}/reverse/generalReverse`, {
      params: {
        accessToken: MAPS_ACCESS_TOKEN,
        lat,
        lng,
      },
    });

    if (response.data.success) {
      console.log('location', response.data.data);

      return response.data.data;
    }

    return null;
  } catch (error) {
    console.log('Error while fetching maps data', error);
    return null;
  }
};
export { compeletAutoSearch, getOptimalRoute, reverseGeoCode };
