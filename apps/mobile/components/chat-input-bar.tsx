import { useCallback, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "@/components/icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useTranslation } from "@/lib/i18n";

type ChatInputBarProps = {
	onSubmit: (message: string) => void;
	placeholder?: string;
	disabled?: boolean;
};

export function ChatInputBar({
	onSubmit,
	placeholder,
	disabled = false,
}: ChatInputBarProps) {
	const colors = useThemeColors();
	const { t } = useTranslation();
	const inputRef = useRef<TextInput>(null);
	const [value, setValue] = useState("");

	const handleSubmit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed || disabled) return;

		onSubmit(trimmed);
		setValue("");
		Keyboard.dismiss();
	}, [value, disabled, onSubmit]);

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.card, borderTopColor: colors.border },
			]}
		>
			<View style={[styles.inputWrapper, { backgroundColor: colors.muted }]}>
				<Icon
					name="storm"
					size={18}
					color={colors.mutedForeground}
					style={styles.icon}
				/>
				<TextInput
					ref={inputRef}
					style={[styles.input, { color: colors.foreground }]}
					placeholder={
						placeholder || t("chat.placeholder") || "Pregunta sobre tu ruta..."
					}
					placeholderTextColor={colors.mutedForeground}
					value={value}
					onChangeText={setValue}
					onSubmitEditing={handleSubmit}
					returnKeyType="send"
					editable={!disabled}
					maxLength={300}
				/>
				<Pressable
					onPress={handleSubmit}
					disabled={!value.trim() || disabled}
					style={[
						styles.sendButton,
						{
							backgroundColor:
								value.trim() && !disabled ? colors.primary : "transparent",
						},
					]}
				>
					<Icon
						name="send"
						size={16}
						color={
							value.trim() && !disabled
								? colors.primaryForeground
								: colors.mutedForeground
						}
					/>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderTopWidth: 1,
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 24,
		paddingHorizontal: 12,
		height: 44,
	},
	icon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		fontFamily: "Inter_400Regular",
		fontSize: 14,
		paddingVertical: 0,
	},
	sendButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
});
