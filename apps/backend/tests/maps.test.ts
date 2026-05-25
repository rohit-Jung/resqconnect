import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRoute } from '@/controllers/maps.controller';
import { getRouteFromMapbox } from '@/services/mapbox.service';

vi.mock('@/services/mapbox.service', () => ({
  getRouteFromMapbox: vi.fn(),
}));

const DEST = {
  lat: 27.712274418563016,
  lng: 85.33074464614758,
};

const ORIGIN = {
  lat: 27.739476565007855,
  lng: 85.38770057549222,
};

describe('Test Maps Controllers', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      body: {
        profile: 'driving-traffic',
        origin: ORIGIN,
        dest: DEST,
      },
    };

    mockRes = {
      status: vi.fn((code: number) => mockRes),
      json: vi.fn((data: any) => data),
    };

    mockNext = vi.fn(() => {});
  });

  it('should return route data on valid request', async () => {
    (getRouteFromMapbox as any).mockResolvedValue({
      success: true,
      route: { distance: 5000, duration: 600, geometry: { coordinates: [] } },
    });

    await getRoute(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Route Found Successfully' })
    );
  });

  it('should return 400 on invalid body data', async () => {
    mockReq.body = { profile: 'driving-traffic' }; // missing origin/dest

    await getRoute(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
