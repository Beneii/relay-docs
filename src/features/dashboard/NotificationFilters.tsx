import { useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import type { NotificationRecord } from './types';

const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 24 hours', value: '24h' },
] as const;

const SEVERITY_OPTIONS = [
  { label: 'All severities', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
] as const;

interface NotificationFiltersProps {
  notifications: NotificationRecord[];
  search: string;
  severity: 'all' | 'info' | 'warning' | 'critical';
  channel: string;
  dateRange: 'all' | '30d' | '7d' | '24h';
  onSearchChange: (value: string) => void;
  onSeverityChange: (value: 'all' | 'info' | 'warning' | 'critical') => void;
  onChannelChange: (value: string) => void;
  onDateRangeChange: (value: 'all' | '30d' | '7d' | '24h') => void;
  filteredCount: number;
}

export function NotificationFilters({
  notifications,
  search,
  severity,
  channel,
  dateRange,
  onSearchChange,
  onSeverityChange,
  onChannelChange,
  onDateRangeChange,
  filteredCount,
}: NotificationFiltersProps) {
  const channels = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((notification) => {
      if (notification.channel) {
        set.add(notification.channel);
      }
    });
    return Array.from(set).sort();
  }, [notifications]);

  const handleClear = () => {
    onSearchChange('');
    onSeverityChange('all');
    onChannelChange('all');
    onDateRangeChange('all');
  };

  const hasFilters = search || severity !== 'all' || channel !== 'all' || dateRange !== 'all';

  return (
    <div className="border border-border rounded-2xl p-4 bg-bg mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search title or body"
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[520px]">
            <select
              className="h-11 rounded-lg border border-border bg-bg text-sm px-3"
              value={severity}
              onChange={(event) => onSeverityChange(event.target.value as NotificationFiltersProps['severity'])}
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-border bg-bg text-sm px-3"
              value={channel}
              onChange={(event) => onChannelChange(event.target.value)}
            >
              <option value="all">All channels</option>
              {channels.map((channelName) => (
                <option key={channelName} value={channelName}>
                  #{channelName}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-lg border border-border bg-bg text-sm px-3"
              value={dateRange}
              onChange={(event) => onDateRangeChange(event.target.value as NotificationFiltersProps['dateRange'])}
            >
              {DATE_RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>
              Showing <span className="text-text-main font-semibold">{filteredCount}</span> of{' '}
              <span className="text-text-main font-semibold">{notifications.length}</span>
            </span>
          </div>
          {hasFilters ? (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-accent hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
