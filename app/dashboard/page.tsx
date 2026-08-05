import React from 'react';
import MileageDashboard from '@/components/MileageDashboard';
import { User } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#08080A] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Clean Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-[#1E1E24] pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FC4C02] text-white">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-athletic uppercase">
              Developer Profile & Mileage
            </h1>
            <p className="text-xs text-zinc-500 font-mono">
              Telemetry analytics, skill percentile ranks, and agent fleet controls
            </p>
          </div>
        </div>

        {/* Dashboard Component */}
        <MileageDashboard />

      </div>
    </div>
  );
}
