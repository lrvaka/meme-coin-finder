'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, SortAsc, SortDesc, Zap, Shield, TrendingUp, Clock, Rocket } from 'lucide-react';
import type { TokenFilter } from '@/types/token';

interface FiltersProps {
  filter: TokenFilter;
  onFilterChange: (filter: TokenFilter) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (dir: 'asc' | 'desc') => void;
}

const PRESETS = [
  {
    name: 'All',
    icon: Filter,
    filter: {},
  },
  {
    name: 'Primed',
    icon: Rocket,
    description: 'Ready to run - accumulation phase',
    filter: { minLiquidity: 10000, minMarketCap: 100000, maxMarketCap: 20000000 },
  },
  {
    name: 'Degen',
    icon: Zap,
    description: 'High risk, early entries',
    filter: { minLiquidity: 5000, maxAge: 48 },
  },
  {
    name: 'Safe-ish',
    icon: Shield,
    description: 'Higher liquidity, established',
    filter: { minLiquidity: 50000, minVolume24h: 100000 },
  },
  {
    name: 'Hot',
    icon: TrendingUp,
    description: 'High volume movers',
    filter: { minLiquidity: 10000, minVolume24h: 500000 },
  },
  {
    name: 'Fresh',
    icon: Clock,
    description: 'New launches',
    filter: { minLiquidity: 5000, maxAge: 24 },
  },
];

const LIQUIDITY_OPTIONS = [
  { value: '0', label: 'Any Liquidity' },
  { value: '5000', label: '$5K+' },
  { value: '10000', label: '$10K+' },
  { value: '25000', label: '$25K+' },
  { value: '50000', label: '$50K+' },
  { value: '100000', label: '$100K+' },
];

const AGE_OPTIONS = [
  { value: '0', label: 'Any Age' },
  { value: '6', label: '< 6 hours' },
  { value: '24', label: '< 24 hours' },
  { value: '48', label: '< 2 days' },
  { value: '168', label: '< 7 days' },
  { value: '720', label: '< 30 days' },
];

const VOLUME_OPTIONS = [
  { value: '0', label: 'Any Volume' },
  { value: '10000', label: '$10K+' },
  { value: '50000', label: '$50K+' },
  { value: '100000', label: '$100K+' },
  { value: '500000', label: '$500K+' },
  { value: '1000000', label: '$1M+' },
];

const SORT_OPTIONS = [
  { value: 'runPotential', label: 'Run Potential 🚀' },
  { value: 'volume', label: 'Volume 24h' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'priceChange', label: 'Price Change' },
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'age', label: 'Age (Newest)' },
  { value: 'safety', label: 'Safety Score' },
];

export function Filters({
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
}: FiltersProps) {
  const activePreset = PRESETS.find(
    (p) =>
      (p.filter.minLiquidity || 0) === (filter.minLiquidity || 0) &&
      (p.filter.maxAge || 0) === (filter.maxAge || 0) &&
      (p.filter.minVolume24h || 0) === (filter.minVolume24h || 0)
  );

  return (
    <div className="space-y-3 py-4">
      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Quick filters:</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.name}
            variant={activePreset?.name === preset.name ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => onFilterChange(preset.filter)}
          >
            <preset.icon className="h-3.5 w-3.5" />
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Custom Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Custom:</span>
        </div>

        <Select
          value={String(filter.minLiquidity || 0)}
          onValueChange={(value) =>
            onFilterChange({ ...filter, minLiquidity: parseInt(value) || undefined })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Liquidity" />
          </SelectTrigger>
          <SelectContent>
            {LIQUIDITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filter.maxAge || 0)}
          onValueChange={(value) =>
            onFilterChange({ ...filter, maxAge: parseInt(value) || undefined })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            {AGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filter.minVolume24h || 0)}
          onValueChange={(value) =>
            onFilterChange({ ...filter, minVolume24h: parseInt(value) || undefined })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Volume" />
          </SelectTrigger>
          <SelectContent>
            {VOLUME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'desc' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Active filters summary */}
      {(filter.minLiquidity || filter.maxAge || filter.minVolume24h) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active:</span>
          {filter.minLiquidity && (
            <Badge variant="secondary" className="text-xs">
              Liq ${(filter.minLiquidity / 1000).toFixed(0)}K+
            </Badge>
          )}
          {filter.maxAge && (
            <Badge variant="secondary" className="text-xs">
              Age &lt;{filter.maxAge}h
            </Badge>
          )}
          {filter.minVolume24h && (
            <Badge variant="secondary" className="text-xs">
              Vol ${(filter.minVolume24h / 1000).toFixed(0)}K+
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs"
            onClick={() => onFilterChange({})}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
