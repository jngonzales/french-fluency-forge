import { QRCodeSVG } from "qrcode.react";
import { ExportData } from "./types";

interface Props {
  data: ExportData;
}

// Thick axis bar for social export
function ThickAxisBar({ 
  leftLabel, 
  rightLabel, 
  normalized,
  label
}: { 
  leftLabel: string; 
  rightLabel: string; 
  normalized: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-base font-semibold opacity-90">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-5 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-white rounded-full transition-all"
          style={{ width: `${normalized}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-white/50"
          style={{ left: `${normalized}%` }}
        />
      </div>
      <p className="text-center text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

export function SocialSlide1({ data }: Props) {
  // Only show positive badges (high scores = flow, expressiveness, risk)
  const positiveBadges = data.badges.filter(b => b.direction === 'high');

  return (
    <div 
      className="flex flex-col text-white overflow-hidden"
      style={{ 
        width: 1080, 
        height: 1920,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top spacing */}
      <div style={{ height: 120 }} />

      {/* Header */}
      <div className="text-center px-16">
        <p className="text-xl uppercase tracking-[0.35em] opacity-70 mb-8">Your Learning Personality</p>
        <div style={{ fontSize: 140 }} className="mb-6">
          {data.archetype.emoji}
        </div>
        <p className="text-2xl opacity-70 mb-2">You're the</p>
        <h1 className="text-6xl font-bold leading-tight">
          {data.archetype.name}
        </h1>
        <p className="text-xl opacity-70 mt-4">
          {data.archetype.signature}
        </p>
      </div>

      {/* Axis bars */}
      <div className="px-20 mt-16">
        <div className="space-y-8">
          <ThickAxisBar 
            leftLabel="Control" 
            rightLabel="Flow" 
            normalized={data.axes.control_flow.normalized}
            label={data.axes.control_flow.label}
          />
          <ThickAxisBar 
            leftLabel="Accuracy" 
            rightLabel="Expressiveness" 
            normalized={data.axes.accuracy_expressiveness.normalized}
            label={data.axes.accuracy_expressiveness.label}
          />
          <ThickAxisBar 
            leftLabel="Security" 
            rightLabel="Risk" 
            normalized={data.axes.security_risk.normalized}
            label={data.axes.security_risk.label}
          />
        </div>
      </div>

      {/* Positive Badges only */}
      {positiveBadges.length > 0 && (
        <div className="px-16 mt-16">
          <p className="text-center text-sm uppercase tracking-wider opacity-60 mb-6">Your Superpowers</p>
          <div className="flex flex-col gap-4">
            {positiveBadges.map((badge) => (
              <div 
                key={badge.id} 
                className="flex items-center gap-4 bg-white/15 backdrop-blur px-6 py-4 rounded-2xl"
              >
                <span className="text-4xl">{badge.icon}</span>
                <div>
                  <p className="text-xl font-bold">{badge.name}</p>
                  <p className="text-base opacity-80">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with QR */}
      <div className="mt-auto px-16 pb-16 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold">Take the full assessment</p>
          <p className="text-lg opacity-70 mt-1">{data.shareUrl.replace('https://', '')}</p>
        </div>
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={data.shareUrl} size={100} />
        </div>
      </div>
    </div>
  );
}
