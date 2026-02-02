import { customType, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Define a custom geometry type for PostGIS
const geometry = customType<{
  data: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[];
  };
  driverData: string;
}>({
  dataType() {
    return 'geometry(Point, 4326)'; // or geometry(Polygon, 4326), etc.
  },
  toDriver(value) {
    // Convert JS object to PostGIS format
    return `SRID=4326;POINT(${value.coordinates[0]} ${value.coordinates[1]})`;
  },
  fromDriver(value) {
    // Parse PostGIS data back to JS object
    // This is a simplified parser - you might want to use a library
    const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      return {
        type: 'Point',
        coordinates: [parseFloat(match[1]), parseFloat(match[2])],
      };
    }
    return value;
  },
});
