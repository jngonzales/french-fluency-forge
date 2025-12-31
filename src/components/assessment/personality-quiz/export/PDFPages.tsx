import { QRCodeSVG } from "qrcode.react";
import { ExportData } from "./types";

interface Props {
  data: ExportData;
}

// A4 dimensions: 210mm × 297mm at 96 DPI ≈ 794 × 1123 px
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

function PDFAxisBar({ 
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
    <div className="mb-4">
      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-indigo-500 rounded-full"
          style={{ width: `${normalized}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow"
          style={{ left: `${normalized}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-medium text-indigo-600">{Math.round(normalized)}%</span>
      </div>
    </div>
  );
}

export function PDFPage1({ data }: Props) {
  return (
    <div 
      className="bg-white text-gray-900 p-12"
      style={{ 
        width: PAGE_WIDTH, 
        height: PAGE_HEIGHT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-8 mb-8">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Learning Personality Assessment</p>
        <div className="text-6xl mb-4">{data.archetype.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.archetype.name}</h1>
        <p className="text-lg text-indigo-600">{data.archetype.signature}</p>
      </div>

      {/* 3-Axis Profile */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
          Your 3-Axis Profile
        </h2>
        <div className="bg-gray-50 rounded-xl p-6">
          <PDFAxisBar 
            leftLabel="Control" 
            rightLabel="Flow" 
            normalized={data.axes.control_flow.normalized}
            label={data.axes.control_flow.label}
          />
          <PDFAxisBar 
            leftLabel="Accuracy" 
            rightLabel="Expressiveness" 
            normalized={data.axes.accuracy_expressiveness.normalized}
            label={data.axes.accuracy_expressiveness.label}
          />
          <PDFAxisBar 
            leftLabel="Security" 
            rightLabel="Risk" 
            normalized={data.axes.security_risk.normalized}
            label={data.axes.security_risk.label}
          />
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
            Badges Earned
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {data.badges.map((badge) => (
              <div 
                key={badge.id}
                className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100"
              >
                <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About You */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
          About You
        </h2>
        <p className="text-sm leading-relaxed text-gray-700">
          {data.archetype.description}
        </p>
      </div>

      {/* Page number */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        Page 1 of 3
      </div>
    </div>
  );
}

export function PDFPage2({ data }: Props) {
  return (
    <div 
      className="bg-white text-gray-900 p-12 relative"
      style={{ 
        width: PAGE_WIDTH, 
        height: PAGE_HEIGHT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6 mb-8">
        <span className="text-4xl">{data.archetype.emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.archetype.name}</h1>
          <p className="text-sm text-gray-500">{data.archetype.signature}</p>
        </div>
      </div>

      {/* Insights Grid */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        Your Learning Profile Insights
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Strengths */}
        <div className="p-5 rounded-xl bg-green-50 border border-green-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h3 className="font-semibold text-green-800">Your Strengths</h3>
          </div>
          <p className="text-sm text-green-700 leading-relaxed">{data.archetype.strengths}</p>
        </div>

        {/* Bottleneck */}
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔍</span>
            <h3 className="font-semibold text-amber-800">Hidden Bottleneck</h3>
          </div>
          <p className="text-sm text-amber-700 leading-relaxed">{data.archetype.bottleneck}</p>
        </div>

        {/* Fastest Path */}
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🚀</span>
            <h3 className="font-semibold text-blue-800">Fastest Path</h3>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">{data.archetype.fastestPath}</p>
        </div>

        {/* Danger Path */}
        <div className="p-5 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-semibold text-red-800">Danger Path</h3>
          </div>
          <p className="text-sm text-red-700 leading-relaxed">{data.archetype.dangerPath}</p>
        </div>
      </div>

      {/* Encouragement */}
      {data.archetype.encouragement && (
        <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100 mb-8">
          <p className="text-sm text-indigo-700 leading-relaxed italic">
            💡 {data.archetype.encouragement}
          </p>
        </div>
      )}

      {/* Keep Doing */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
        Keep Doing
      </h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {data.archetype.recommendations.keep.map((item, i) => (
          <span 
            key={i}
            className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium"
          >
            ✓ {item}
          </span>
        ))}
      </div>

      {/* Page number */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        Page 2 of 3
      </div>
    </div>
  );
}

export function PDFPage3({ data }: Props) {
  return (
    <div 
      className="bg-white text-gray-900 p-12 relative"
      style={{ 
        width: PAGE_WIDTH, 
        height: PAGE_HEIGHT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6 mb-8">
        <span className="text-4xl">{data.archetype.emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.archetype.name}</h1>
          <p className="text-sm text-gray-500">Personalized Recommendations</p>
        </div>
      </div>

      {/* Add Next */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        Add Next
      </h2>
      <div className="space-y-3 mb-8">
        {data.archetype.recommendations.add.map((item, i) => (
          <div 
            key={i}
            className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <p className="text-sm text-blue-800 leading-relaxed flex-1 pt-1">{item}</p>
          </div>
        ))}
      </div>

      {/* Watch Out */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
        Watch Out For
      </h2>
      <div className="p-5 rounded-xl bg-amber-50 border border-amber-100 mb-12">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-amber-700 leading-relaxed">
            {data.archetype.recommendations.watchOut}
          </p>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="absolute bottom-16 left-12 right-12">
        <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <div>
            <h3 className="text-xl font-bold mb-1">Continue Your Journey</h3>
            <p className="text-sm opacity-90">Take the full fluency assessment to get personalized training.</p>
            <p className="text-xs opacity-70 mt-2">{data.shareUrl}</p>
          </div>
          <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG value={data.shareUrl} size={80} />
          </div>
        </div>
      </div>

      {/* Page number */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        Page 3 of 3
      </div>
    </div>
  );
}
