import { Smartphone, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FREE_LIMITS } from '@shared/product';
import { timeAgo } from '@shared/time';

import type { DeviceRecord, UserData } from './types';

interface DevicesSectionProps {
  devices: DeviceRecord[];
  user: UserData;
  onRemoveDevice: (id: string) => void;
}

export function DevicesSection({ devices, user, onRemoveDevice }: DevicesSectionProps) {
  const deviceLimit = user.plan === 'pro' ? Infinity : FREE_LIMITS.devices;
  const atLimit = user.plan === 'free' && devices.length >= FREE_LIMITS.devices;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-text-muted" />
          Devices
        </h2>
        <span className="text-xs text-text-muted">
          {devices.length}{deviceLimit !== Infinity ? `/${deviceLimit}` : ''} registered
        </span>
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-text-muted">
          No devices registered. Download the Relay app to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-bg border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{device.platform}</p>
                  <p className="text-xs text-text-muted">Added {timeAgo(device.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveDevice(device.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                aria-label="Remove device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {atLimit && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">Free plan: {FREE_LIMITS.devices} device.</p>
          <Link
            to="/pricing"
            className="text-xs font-medium text-accent hover:text-emerald-600 transition-colors shrink-0"
          >
            Upgrade for more
          </Link>
        </div>
      )}
    </div>
  );
}
