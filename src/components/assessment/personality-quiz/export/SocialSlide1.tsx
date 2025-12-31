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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 600, opacity: 0.85, marginBottom: 12 }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 14, overflow: 'hidden' }}>
        <div 
          style={{ 
            position: 'absolute',
            height: '100%',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 14,
            width: `${normalized}%`
          }}
        />
        <div 
          style={{ 
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            left: `${normalized}%`
          }}
        />
      </div>
      <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 500, opacity: 0.7, marginTop: 10 }}>{label}</p>
    </div>
  );
}

export function SocialSlide1({ data }: Props) {
  // Only show positive badges (high scores = flow, expressiveness, risk)
  const positiveBadges = data.badges.filter(b => b.direction === 'high');

  return (
    <div 
      className="flex flex-col overflow-hidden"
      style={{ 
        width: 1080, 
        height: 1920,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f8f8f8',
      }}
    >
      {/* Top spacing */}
      <div style={{ height: 100 }} />

      {/* Header */}
      <div className="text-center px-16">
        <p style={{ fontSize: 28, letterSpacing: '0.3em', opacity: 0.6, marginBottom: 40 }} className="uppercase">
          Your Learning Personality
        </p>
        <div style={{ fontSize: 180, marginBottom: 32 }}>
          {data.archetype.emoji}
        </div>
        <p style={{ fontSize: 36, opacity: 0.7, marginBottom: 8 }}>You're the</p>
        <h1 style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
          {data.archetype.name}
        </h1>
        <p style={{ fontSize: 28, opacity: 0.6 }}>
          {data.archetype.signature}
        </p>
      </div>

      {/* Axis bars */}
      <div className="px-20 mt-20">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
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
        <div className="px-16 mt-20">
          <p style={{ fontSize: 22, letterSpacing: '0.15em', opacity: 0.5, marginBottom: 28, textAlign: 'center' }} className="uppercase">
            Your Superpowers
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {positiveBadges.map((badge) => (
              <div 
                key={badge.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px 32px',
                  borderRadius: 20,
                }}
              >
                <span style={{ fontSize: 52 }}>{badge.icon}</span>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700 }}>{badge.name}</p>
                  <p style={{ fontSize: 22, opacity: 0.75 }}>{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with QR */}
      <div style={{ marginTop: 'auto', padding: '0 64px 64px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>Take the full assessment</p>
          <p style={{ fontSize: 24, opacity: 0.6, marginTop: 4 }}>{data.shareUrl.replace('https://', '')}</p>
        </div>
        <div style={{ background: '#fff', padding: 12, borderRadius: 16 }}>
          <QRCodeSVG value={data.shareUrl} size={120} />
        </div>
      </div>
    </div>
  );
}
