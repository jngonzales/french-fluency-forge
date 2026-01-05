/**
 * Score Gauge Component
 * A circular speedometer-style gauge with gradient from red to green
 */

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // SVG parameters
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // We use 270 degrees of the circle (3/4) like a speedometer
  const arcLength = circumference * 0.75;
  const progress = (normalizedScore / 100) * arcLength;
  const offset = arcLength - progress;
  
  // Calculate the color based on score (red -> yellow -> green)
  const getGradientColor = (score: number) => {
    if (score < 50) {
      // Red to Yellow (0-50)
      const ratio = score / 50;
      const r = 239;
      const g = Math.round(68 + (176 - 68) * ratio);
      const b = 68;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Green (50-100)
      const ratio = (score - 50) / 50;
      const r = Math.round(234 - (234 - 34) * ratio);
      const g = Math.round(179 + (197 - 179) * ratio);
      const b = Math.round(8 + (94 - 8) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };
  
  const strokeColor = getGradientColor(normalizedScore);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-[135deg]"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        
        {/* Gradient definition for the arc */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {/* Score text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center mt-4">
          <span 
            className="text-5xl font-bold transition-colors duration-500"
            style={{ color: strokeColor }}
          >
            {normalizedScore}
          </span>
          <span className="text-xl text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  );
}
