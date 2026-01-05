/**
 * Score Gauge Component
 * A circular speedometer-style gauge with gradient from red to green
 * Includes 5-level feedback text based on score
 */

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

// Get feedback text based on score (5 levels)
function getFeedbackText(score: number): { text: string; emoji: string } {
  if (score <= 20) return { text: "Keep practicing", emoji: "💪" };
  if (score <= 40) return { text: "Getting there", emoji: "🎯" };
  if (score <= 60) return { text: "Good effort", emoji: "👍" };
  if (score <= 80) return { text: "Well done!", emoji: "🌟" };
  return { text: "Excellent!", emoji: "🎉" };
}

export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  
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
  const feedback = getFeedbackText(normalizedScore);
  
  return (
    <div className="flex flex-col items-center">
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
        
        {/* Score text in center - properly centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
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
      
      {/* Feedback text below gauge */}
      <div className="mt-2 text-center">
        <span className="text-lg font-medium" style={{ color: strokeColor }}>
          {feedback.emoji} {feedback.text}
        </span>
      </div>
    </div>
  );
}
