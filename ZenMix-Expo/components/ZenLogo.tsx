import { Svg, Circle, Path } from 'react-native-svg';

interface ZenLogoProps {
  size?: number;
  color?: string;
}

export default function ZenLogo({ size = 28, color = '#6366f1' }: ZenLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 8h8M8 8l8 8M8 16h8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}