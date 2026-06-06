import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconName =
  | 'eye'
  | 'eyeOff'
  | 'settings'
  | 'wallet'
  | 'pieChart'
  | 'chevronLeft'
  | 'chevronRight'
  | 'plus'
  | 'check'
  | 'close'
  | 'calendar'
  | 'wifiOff'
  | 'alertCircle'
  | 'refresh'
  | 'sparkles'
  | 'logIn'
  | 'logOut'
  | 'arrowUp'
  | 'image'
  | 'undo'
  | 'stop'
  | 'trash'
  | 'edit';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Crisp stroke icons (Feather-style) drawn with react-native-svg. */
export function Icon({ name, size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) {
  const s = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {GLYPHS[name](s)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

const GLYPHS: Record<IconName, (s: StrokeProps) => ReactNode> = {
  eye: (s) => (
    <>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...s} />
      <Circle cx={12} cy={12} r={3} {...s} />
    </>
  ),
  eyeOff: (s) => (
    <>
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        {...s}
      />
      <Line x1={1} y1={1} x2={23} y2={23} {...s} />
    </>
  ),
  settings: (s) => (
    <>
      <Circle cx={12} cy={12} r={3} {...s} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        {...s}
      />
    </>
  ),
  wallet: (s) => (
    <>
      <Path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" {...s} />
      <Path d="M16 12h4" {...s} />
      <Path d="M18 4H6a2 2 0 0 0-2 2" {...s} />
      <Circle cx={17} cy={13} r={1.1} fill={s.stroke} stroke="none" />
    </>
  ),
  pieChart: (s) => (
    <>
      <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...s} />
      <Path d="M22 12A10 10 0 0 0 12 2v10z" {...s} />
    </>
  ),
  chevronLeft: (s) => <Polyline points="15 18 9 12 15 6" {...s} />,
  chevronRight: (s) => <Polyline points="9 18 15 12 9 6" {...s} />,
  plus: (s) => (
    <>
      <Line x1={12} y1={5} x2={12} y2={19} {...s} />
      <Line x1={5} y1={12} x2={19} y2={12} {...s} />
    </>
  ),
  check: (s) => <Polyline points="20 6 9 17 4 12" {...s} />,
  close: (s) => (
    <>
      <Line x1={18} y1={6} x2={6} y2={18} {...s} />
      <Line x1={6} y1={6} x2={18} y2={18} {...s} />
    </>
  ),
  calendar: (s) => (
    <>
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" {...s} />
      <Line x1={16} y1={2} x2={16} y2={6} {...s} />
      <Line x1={8} y1={2} x2={8} y2={6} {...s} />
      <Line x1={3} y1={10} x2={21} y2={10} {...s} />
    </>
  ),
  wifiOff: (s) => (
    <>
      <Line x1={1} y1={1} x2={23} y2={23} {...s} />
      <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" {...s} />
      <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" {...s} />
      <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" {...s} />
      <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" {...s} />
      <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" {...s} />
      <Line x1={12} y1={20} x2={12.01} y2={20} {...s} />
    </>
  ),
  alertCircle: (s) => (
    <>
      <Circle cx={12} cy={12} r={10} {...s} />
      <Line x1={12} y1={8} x2={12} y2={12} {...s} />
      <Line x1={12} y1={16} x2={12.01} y2={16} {...s} />
    </>
  ),
  refresh: (s) => (
    <>
      <Polyline points="23 4 23 10 17 10" {...s} />
      <Polyline points="1 20 1 14 7 14" {...s} />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...s} />
    </>
  ),
  sparkles: (s) => (
    <>
      <Path d="M10 3 L11.6 8.4 L17 10 L11.6 11.6 L10 17 L8.4 11.6 L3 10 L8.4 8.4 Z" {...s} />
      <Path d="M18 13 L18.7 15.3 L21 16 L18.7 16.7 L18 19 L17.3 16.7 L15 16 L17.3 15.3 Z" {...s} />
    </>
  ),
  logIn: (s) => (
    <>
      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" {...s} />
      <Polyline points="10 17 15 12 10 7" {...s} />
      <Line x1={15} y1={12} x2={3} y2={12} {...s} />
    </>
  ),
  logOut: (s) => (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...s} />
      <Polyline points="16 17 21 12 16 7" {...s} />
      <Line x1={21} y1={12} x2={9} y2={12} {...s} />
    </>
  ),
  arrowUp: (s) => (
    <>
      <Line x1={12} y1={19} x2={12} y2={5} {...s} />
      <Polyline points="5 12 12 5 19 12" {...s} />
    </>
  ),
  image: (s) => (
    <>
      <Rect x={3} y={3} width={18} height={18} rx={2} {...s} />
      <Circle cx={8.5} cy={8.5} r={1.5} {...s} />
      <Polyline points="21 15 16 10 5 21" {...s} />
    </>
  ),
  undo: (s) => (
    <>
      <Polyline points="9 14 4 9 9 4" {...s} />
      <Path d="M20 20v-7a4 4 0 0 0-4-4H4" {...s} />
    </>
  ),
  stop: (s) => <Rect x={6} y={6} width={12} height={12} rx={2} fill={s.stroke} stroke="none" />,
  trash: (s) => (
    <>
      <Polyline points="3 6 5 6 21 6" {...s} />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...s} />
    </>
  ),
  edit: (s) => <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" {...s} />,
};
