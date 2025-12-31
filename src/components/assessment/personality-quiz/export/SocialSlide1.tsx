import { QRCodeSVG } from "qrcode.react";
import { ExportData, ExportFormat, FORMAT_DIMENSIONS } from "./types";

interface Props {
  data: ExportData;
  format: ExportFormat;
}

// Mini axis bar for social export
function MiniAxisBar({ 
  leftLabel, 
  rightLabel, 
  normalized 
}: { 
  leftLabel: string; 
  rightLabel: string; 
  normalized: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium opacity-70">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-white rounded-full"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

export function SocialSlide1({ data, format }: Props) {
  const { width, height } = FORMAT_DIMENSIONS[format];
  const scale = format === 'story' ? 1 : format === 'post' ? 0.85 : 0.75;

  return (
    <div 
      className="flex flex-col text-white overflow-hidden"
      style={{ 
        width, 
        height,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top spacing */}
      <div style={{ height: height * 0.08 }} />

      {/* Header */}
      <div className="text-center px-12">
        <p className="text-sm uppercase tracking-[0.3em] opacity-70 mb-4">Your Learning Personality</p>
        <div style={{ fontSize: 120 * scale }} className="mb-4">
          {data.archetype.emoji}
        </div>
        <h1 style={{ fontSize: 48 * scale }} className="font-bold mb-2">
          {data.archetype.name}
        </h1>
        <p style={{ fontSize: 20 * scale }} className="opacity-80">
          {data.archetype.signature}
        </p>
      </div>

      {/* Axis bars */}
      <div className="px-16 mt-auto" style={{ marginTop: height * 0.06 }}>
        <p className="text-center text-sm uppercase tracking-wider opacity-60 mb-6">Your 3-Axis Profile</p>
        <div className="space-y-4">
          <MiniAxisBar 
            leftLabel="Control" 
            rightLabel="Flow" 
            normalized={data.axes.control_flow.normalized} 
          />
          <MiniAxisBar 
            leftLabel="Accuracy" 
            rightLabel="Expressiveness" 
            normalized={data.axes.accuracy_expressiveness.normalized} 
          />
          <MiniAxisBar 
            leftLabel="Security" 
            rightLabel="Risk" 
            normalized={data.axes.security_risk.normalized} 
          />
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <div className="px-12" style={{ marginTop: height * 0.05 }}>
          <p className="text-center text-xs uppercase tracking-wider opacity-60 mb-4">Badges Earned</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {data.badges.slice(0, 4).map((badge) => (
              <div 
                key={badge.id} 
                className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full"
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with QR */}
      <div className="mt-auto px-12 pb-12 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Take the full assessment</p>
          <p className="text-sm opacity-70">{data.shareUrl.replace('https://', '')}</p>
        </div>
        <div className="bg-white p-2 rounded-lg">
          <QRCodeSVG value={data.shareUrl} size={80} />
        </div>
      </div>
    </div>
  );
}
