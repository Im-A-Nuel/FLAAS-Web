"use client";
import { IoStatsChartOutline } from "react-icons/io5";

interface AggregationResultProps {
  result: {
    method?: string;
    num_clients?: number;
    num_layers?: number;
    avg_global_weight?: number;
    avg_global_weight_change_percent?: number;
  } | null;
}

export default function AggregationResult({ result }: AggregationResultProps) {
  if (!result) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-3 text-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
          <IoStatsChartOutline className="text-white text-sm" />
        </div>
        <div>
          <span className="text-sm font-medium">Aggregation Result</span>
          <p className="text-xs text-indigo-100">{result.method}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-white/10 rounded p-2">
          <div className="text-xs text-indigo-100 mb-1">Jumlah Bobot/Weight:</div>
          <div className="text-sm font-bold text-white">
            {result.avg_global_weight?.toFixed(6) || '0.000000'}
          </div>
        </div>

        <div className="bg-white/10 rounded p-2">
          <div className="text-xs text-indigo-100 mb-1">Weight Change:</div>
          <div className="text-sm font-bold text-white">
            {result.avg_global_weight_change_percent?.toFixed(6) || '0.000000'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded p-2">
            <div className="text-xs text-indigo-100">Clients</div>
            <div className="text-sm font-semibold text-white">{result.num_clients || 0}</div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="text-xs text-indigo-100">Layers</div>
            <div className="text-sm font-semibold text-white">{result.num_layers || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
