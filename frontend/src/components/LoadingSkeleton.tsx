import { getVibeStripe } from '../utils/vibeTheme';

interface LoadingSkeletonProps {
  vibeId: string;
}

export default function LoadingSkeleton({ vibeId }: LoadingSkeletonProps) {
  const { colors } = getVibeStripe(vibeId);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden bg-[#fbf9f4]
                    shadow-xl shadow-[#0d1117]/8 border border-[#0d1117]/10
                    flex flex-col animate-pulse">
      {/* Static stripe header — real colors, just dimmed by pulse */}
      <div className="h-40 w-full flex">
        <div className="flex-1" style={{ backgroundColor: colors[0] }} />
        <div className="flex-1" style={{ backgroundColor: colors[1] }} />
        <div className="flex-1" style={{ backgroundColor: colors[2] }} />
        <div className="flex-1" style={{ backgroundColor: colors[3] }} />
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-[#0d1117]/8" />
          <div className="h-7 w-4/5 rounded bg-[#0d1117]/10" />
          <div className="h-7 w-2/3 rounded bg-[#0d1117]/10" />
          <div className="h-3 w-1/2 rounded bg-[#0d1117]/8 mt-4" />
        </div>
        <div className="h-3 w-32 rounded bg-[#0d1117]/8" />
      </div>
    </div>
  );
}