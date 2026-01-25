// apps/native/components/icons.tsx

import {
	Alert01Icon,
	AlertDiamondIcon,
	AnalyticsUpIcon,
	ArrowDown01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	CarParking01Icon,
	CheckmarkCircle01Icon,
	Clock01Icon,
	CloudAngledZapIcon,
	CloudIcon,
	Copy01Icon,
	Delete02Icon,
	DollarCircleIcon,
	FuelStationIcon,
	HelpCircleIcon,
	InformationCircleIcon,
	LanguageCircleIcon,
	Location01Icon,
	LockIcon,
	Logout01Icon,
	Mail01Icon,
	MapsIcon,
	Mic01Icon,
	MicOff01Icon,
	Navigation03Icon,
	Notification01Icon,
	PaintBoardIcon,
	PinLocation01Icon,
	Refresh01Icon,
	Road01Icon,
	Route01Icon,
	Search01Icon,
	SentIcon,
	Settings01Icon,
	ShieldUserIcon,
	StarIcon,
	Store01Icon,
	SunCloud01Icon,
	Tick01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type IconName =
	| "map"
	| "route"
	| "user"
	| "storm"
	| "money"
	| "road"
	| "notification"
	| "location"
	| "theme"
	| "language"
	| "help"
	| "logout"
	| "send"
	| "stats"
	| "settings"
	| "arrowRight"
	| "arrowLeft"
	| "mail"
	| "star"
	| "close"
	| "check"
	| "checkCircle"
	| "checkmark"
	| "alert"
	| "lock"
	| "trash"
	| "delete"
	| "info"
	| "refresh"
	| "weather"
	| "warning"
	| "chevron-down"
	| "clock"
	| "search"
	| "voice"
	| "gas"
	| "parking"
	| "store"
	| "navigation"
	| "shield"
	| "copy"
	| "rain"
	| "mute"
	| "pin"
	| "history";

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
	checkmark: Tick01Icon,
	alert: Alert01Icon,
	lock: LockIcon,
	trash: Delete02Icon,
	delete: Delete02Icon,
	info: InformationCircleIcon,
	refresh: Refresh01Icon,
	weather: SunCloud01Icon,
	warning: AlertDiamondIcon,
	"chevron-down": ArrowDown01Icon,
	clock: Clock01Icon,
	search: Search01Icon,
	voice: Mic01Icon,
	gas: FuelStationIcon,
	parking: CarParking01Icon,
	store: Store01Icon,
	navigation: Navigation03Icon,
	shield: ShieldUserIcon,
	copy: Copy01Icon,
	rain: CloudIcon,
	mute: MicOff01Icon,
	pin: PinLocation01Icon,
	history: Clock01Icon,
} as const;

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
	strokeWidth?: number;
	style?: object;
}

export function Icon({
	name,
	size = 24,
	color,
	strokeWidth = 1.5,
	style,
}: IconProps) {
	const colors = useThemeColors();
	const IconComponent = iconMap[name];

	return (
		<HugeiconsIcon
			icon={IconComponent}
			size={size}
			color={color || colors.foreground}
			strokeWidth={strokeWidth}
			style={style}
		/>
	);
}
