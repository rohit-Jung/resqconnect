'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import { IServiceProvider } from '@/services/organization/providers.api';
import { ServiceType } from '@/types/auth.types';

const serviceTypeColors: Record<ServiceType, string> = {
  ambulance: '#ef4444',
  police: '#3b82f6',
  fire_truck: '#f97316',
  rescue_team: '#22c55e',
};

const serviceTypeLabels: Record<ServiceType, string> = {
  ambulance: 'Ambulance',
  police: 'Police',
  fire_truck: 'Fire Truck',
  rescue_team: 'Rescue Team',
};

function createProviderIcon(serviceType: ServiceType, isSelected: boolean) {
  const color = serviceTypeColors[serviceType] || '#6b7280';
  const size = isSelected ? 40 : 32;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size * 0.45}px;
        font-weight: bold;
        transition: all 0.2s;
        ${isSelected ? 'transform: scale(1.2); box-shadow: 0 0 0 4px ' + color + '40;' : ''}
      ">
        ${serviceType.charAt(0).toUpperCase()}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'available':
      return 'Available';
    case 'assigned':
      return 'On Duty';
    case 'off_duty':
      return 'Off Duty';
    default:
      return status;
  }
}

function MapUpdater({
  selectedProviderId,
  providers,
}: {
  selectedProviderId: string | null;
  providers: IServiceProvider[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedProviderId) {
      const provider = providers.find(p => p.id === selectedProviderId);
      if (
        provider?.currentLocation?.latitude &&
        provider?.currentLocation?.longitude
      ) {
        map.flyTo(
          [
            parseFloat(provider.currentLocation.latitude),
            parseFloat(provider.currentLocation.longitude),
          ],
          15,
          { duration: 0.5 }
        );
      }
    }
  }, [selectedProviderId, providers, map]);

  return null;
}

interface ProviderMapProps {
  providers: IServiceProvider[];
  selectedProviderId: string | null;
  onSelectProvider: (id: string | null) => void;
}

export default function ProviderMap({
  providers,
  selectedProviderId,
  onSelectProvider,
}: ProviderMapProps) {
  const mapRef = useRef<L.Map>(null);

  const providersWithLocation = providers.filter(
    p => p.currentLocation?.latitude && p.currentLocation?.longitude
  );

  const center: [number, number] =
    providersWithLocation.length > 0
      ? [
          parseFloat(providersWithLocation[0].currentLocation!.latitude),
          parseFloat(providersWithLocation[0].currentLocation!.longitude),
        ]
      : [27.7172, 85.324];

  return (
    <div className="h-[500px] w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        ref={mapRef}
        className="h-full w-full rounded-b-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          selectedProviderId={selectedProviderId}
          providers={providers}
        />
        {providersWithLocation.map(provider => {
          const lat = parseFloat(provider.currentLocation!.latitude);
          const lng = parseFloat(provider.currentLocation!.longitude);
          const isSelected = selectedProviderId === provider.id;

          return (
            <Marker
              key={provider.id}
              position={[lat, lng]}
              icon={createProviderIcon(provider.serviceType, isSelected)}
              eventHandlers={{
                click: () => onSelectProvider(provider.id),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold">{provider.name}</p>
                  <p className="text-sm text-gray-500">
                    {serviceTypeLabels[provider.serviceType]}
                  </p>
                  <p className="mt-1 text-xs">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 font-medium ${
                        provider.serviceStatus === 'available'
                          ? 'bg-green-100 text-green-700'
                          : provider.serviceStatus === 'assigned'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabel(provider.serviceStatus)}
                    </span>
                  </p>
                  {provider.serviceArea && (
                    <p className="mt-1 text-xs text-gray-500">
                      {provider.serviceArea}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {providersWithLocation.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-white/90 px-4 py-2 text-center shadow">
            <p className="text-sm text-muted-foreground">
              No providers with location data yet
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
