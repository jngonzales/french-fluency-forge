import { QRCodeSVG } from "qrcode.react";
import { ExportData, ExportFormat, FORMAT_DIMENSIONS } from "./types";

interface Props {
  data: ExportData;
  format: ExportFormat;
}

export function SocialSlide3({ data, format }: Props) {
  const { width, height } = FORMAT_DIMENSIONS[format];
  const scale = format === 'story' ? 1 : format === 'post' ? 0.85 : 0.75;

  // Take top 3 recommendations
  const topRecommendations = data.archetype.recommendations.add.slice(0, 3);

  return (
    <div 
      className="flex flex-col text-white overflow-hidden p-12"
      style={{ 
        width, 
        height,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <span style={{ fontSize: 60 * scale }}>{data.archetype.emoji}</span>
        <h2 style={{ fontSize: 32 * scale }} className="font-bold mt-2">
          Your 3 Next Moves
        </h2>
      </div>

      {/* Recommendations */}
      <div className="flex-1 flex flex-col gap-5">
        {topRecommendations.map((rec, i) => (
          <div 
            key={i}
            className="bg-white/10 backdrop-blur rounded-2xl p-6 flex items-start gap-4"
          >
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold"
              style={{ fontSize: 24 * scale }}
            >
              {i + 1}
            </div>
            <p style={{ fontSize: 18 * scale }} className="opacity-95 leading-relaxed flex-1">
              {rec}
            </p>
          </div>
        ))}
      </div>

      {/* Watch out */}
      <div className="bg-amber-500/20 backdrop-blur rounded-2xl p-5 mt-4">
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 24 * scale }}>⚠️</span>
          <div>
            <h4 style={{ fontSize: 16 * scale }} className="font-semibold mb-1">Watch out for</h4>
            <p style={{ fontSize: 15 * scale }} className="opacity-90">
              {data.archetype.recommendations.watchOut}
            </p>
          </div>
        </div>
      </div>

      {/* CTA with QR */}
      <div className="mt-auto pt-8 flex items-center justify-between">
        <div>
          <h3 style={{ fontSize: 24 * scale }} className="font-bold mb-1">
            Take the full assessment
          </h3>
          <p style={{ fontSize: 16 * scale }} className="opacity-70">
            Discover your learning personality
          </p>
          <p style={{ fontSize: 14 * scale }} className="opacity-50 mt-2">
            {data.shareUrl.replace('https://', '')}
          </p>
        </div>
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={data.shareUrl} size={100} />
        </div>
      </div>
    </div>
  );
}
