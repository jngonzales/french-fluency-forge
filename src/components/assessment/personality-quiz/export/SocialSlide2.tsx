import { ExportData, ExportFormat, FORMAT_DIMENSIONS } from "./types";

interface Props {
  data: ExportData;
  format: ExportFormat;
}

export function SocialSlide2({ data, format }: Props) {
  const { width, height } = FORMAT_DIMENSIONS[format];
  const scale = format === 'story' ? 1 : format === 'post' ? 0.85 : 0.75;

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
          {data.archetype.name}
        </h2>
      </div>

      {/* Cards grid */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Strengths */}
        <div 
          className="bg-white/10 backdrop-blur rounded-3xl p-6"
          style={{ flex: 1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: 28 * scale }}>✨</span>
            <h3 style={{ fontSize: 22 * scale }} className="font-semibold">Your Strengths</h3>
          </div>
          <p style={{ fontSize: 18 * scale }} className="opacity-90 leading-relaxed">
            {data.archetype.strengths}
          </p>
        </div>

        {/* Bottleneck */}
        <div 
          className="bg-white/10 backdrop-blur rounded-3xl p-6"
          style={{ flex: 1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: 28 * scale }}>🔍</span>
            <h3 style={{ fontSize: 22 * scale }} className="font-semibold">Hidden Bottleneck</h3>
          </div>
          <p style={{ fontSize: 18 * scale }} className="opacity-90 leading-relaxed">
            {data.archetype.bottleneck}
          </p>
        </div>

        {/* Paths */}
        <div className="grid grid-cols-2 gap-4" style={{ flex: 1 }}>
          <div className="bg-green-500/20 backdrop-blur rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 24 * scale }}>🚀</span>
              <h4 style={{ fontSize: 16 * scale }} className="font-semibold">Fastest Path</h4>
            </div>
            <p style={{ fontSize: 14 * scale }} className="opacity-90">
              {data.archetype.fastestPath}
            </p>
          </div>
          <div className="bg-red-500/20 backdrop-blur rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 24 * scale }}>⚠️</span>
              <h4 style={{ fontSize: 16 * scale }} className="font-semibold">Danger Path</h4>
            </div>
            <p style={{ fontSize: 14 * scale }} className="opacity-90">
              {data.archetype.dangerPath}
            </p>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <div className="text-center mt-6 opacity-70">
        <p style={{ fontSize: 16 * scale }}>Your next level: tiny upgrades, keep the fun.</p>
      </div>
    </div>
  );
}
