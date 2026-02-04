import { HttpStatusCode } from 'axios';
import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { getRoute } from '@/controllers/maps.controller';

// HCK Location
const DEST = {
  lat: 27.712274418563016,
  lng: 85.33074464614758,
};

// Gokarneshwor Location
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
      status: mock((code: number) => mockRes),
      json: mock((data: any) => data),
    };

    mockNext = mock(() => { });
  });

  // TODO: Remove TODO | third party api expensive so
  it.todo('Get Routes Coordinates Give Route on valid data', async () => {
    await getRoute(mockReq, mockRes, mockNext);

    const response = mockRes.json.mock.calls[0][0];

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.Ok);
    expect(response).toEqual(
      expect.objectContaining({
        statusCode: HttpStatusCode.Ok,
        message: 'Route Found Successfully',
        data: {
          coordinates: expect.arrayContaining([
            expect.arrayContaining([expect.any(Number), expect.any(Number)]),
          ]),
          distance: expect.any(Number),
          duration: expect.any(Number),
          steps: expect.any(Array),
        },
      }),
    );
  });

  it.todo('Throws Error on invalid Data', async () => {
    mockReq.body = {
      profile: 'driving-traffic',
      origin: null,
      dest: DEST,
    };

    await getRoute(mockReq, mockRes, mockNext);

    const response = mockRes.json.mock.calls[0][0];
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(response).toEqual(
      expect.objectContaining({
        statusCode: HttpStatusCode.BadRequest,
        message: 'Error validating data',
        errors: expect.any(Array)
      }),
    );
  });
});
