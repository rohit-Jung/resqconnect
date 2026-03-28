import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRoute } from '@/controllers/maps.controller';

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

  it.todo('Get Routes Coordinates Give Route on valid data');
  it.todo('Throws Error on invalid Data');
});
