// apps/native/components/icons.tsx
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  MapsIcon,
  Route01Icon,
  UserIcon,
  CloudAngledZapIcon,
  DollarCircleIcon,
  Road01Icon,
  Notification01Icon,
  Location01Icon,
  PaintBoardIcon,
  LanguageCircleIcon,
  HelpCircleIcon,
  Logout01Icon,
  SentIcon,
  AnalyticsUpIcon,
  Settings01Icon,
  ArrowRight01Icon,
  Mail01Icon,
  StarIcon,
  Cancel01Icon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  LockIcon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type IconName =
  | 'map'
  | 'route'
  | 'user'
  | 'storm'
  | 'money'
  | 'road'
  | 'notification'
  | 'location'
  | 'theme'
  | 'language'
  | 'help'
  | 'logout'
  | 'send'
  | 'stats'
  | 'settings'
  | 'arrowRight'
  | 'arrowLeft'
  | 'mail'
  | 'star'
  | 'close'
  | 'check'
  | 'checkCircle'
  | 'alert'
  | 'lock';

const iconMap = {
  map: MapsIcon,
  route: Route01Icon,
  user: UserIcon,
  storm: CloudAngledZapIcon,
  money: DollarCircleIcon,
  road: Road01Icon,
  notification: Notification01Icon,
  location: Location01Icon,
  theme: PaintBoardIcon,
  language: LanguageCircleIcon,
  help: HelpCircleIcon,
  logout: Logout01Icon,
  send: SentIcon,
  stats: AnalyticsUpIcon,
  settings: Settings01Icon,
  arrowRight: ArrowRight01Icon,
  arrowLeft: ArrowLeft01Icon,
  mail: Mail01Icon,
  star: StarIcon,
  close: Cancel01Icon,
  check: Tick01Icon,
  checkCircle: CheckmarkCircle01Icon,
  alert: Alert01Icon,
  lock: LockIcon,
} as const;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 1.5 }: IconProps) {
  const colors = useThemeColors();
  const IconComponent = iconMap[name];

  return (
    <HugeiconsIcon
      icon={IconComponent}
      size={size}
      color={color || colors.foreground}
      strokeWidth={strokeWidth}
    />
  );
}
