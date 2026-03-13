export interface WebChatStyleOptions {
  accent?: string;
  backgroundColor?: string;
  primaryFont?: string;
  monospaceFont?: string;
  avatarBorderRadius?: number | string;
  avatarSize?: number;
  showAvatarInGroup?: boolean;
  botAvatarImage?: string;
  botAvatarInitials?: string;
  botAvatarBackgroundColor?: string;
  userAvatarImage?: string;
  userAvatarInitials?: string;
  userAvatarBackgroundColor?: string;
  bubbleBackground?: string;
  bubbleBorderColor?: string;
  bubbleBorderRadius?: number | string;
  bubbleTextColor?: string;
  bubbleFromUserBackground?: string;
  bubbleFromUserBorderColor?: string;
  bubbleFromUserBorderRadius?: number | string;
  bubbleFromUserTextColor?: string;
  bubbleMaxWidth?: number;
  bubbleMinHeight?: number;
  bubbleNubSize?: number;
  bubbleFromUserNubSize?: number;
  paddingRegular?: number;
  paddingWide?: number;
  fontSizeSmall?: number;
  fontSizeMedium?: number;
  hideUploadButton?: boolean;
  hideSendBox?: boolean;
  sendBoxBackground?: string;
  sendBoxBorderTop?: string;
  sendBoxButtonColor?: string;
  sendBoxButtonColorOnDisabled?: string;
  sendBoxButtonColorOnFocus?: string;
  sendBoxButtonColorOnHover?: string;
  sendBoxHeight?: number;
  sendBoxMaxHeight?: number;
  sendBoxPlaceholderColor?: string;
  sendBoxTextColor?: string;
  suggestedActionBackground?: string;
  suggestedActionBackgroundColor?: string;
  suggestedActionBorderColor?: string;
  suggestedActionBorderRadius?: number | string;
  suggestedActionTextColor?: string;
  suggestedActionHeight?: number;
  suggestedActionLayout?: "carousel" | "flow" | "stacked";
  suggestedActionSpacing?: number;
  suggestedActionDisabledBackground?: string;
  connectivityIconPadding?: number | string;
  connectivityMarginLeftRight?: number;
  connectivityMarginTopBottom?: number;
  connectivityTextSize?: number;
  notificationText?: string;
  transcriptOverlayBackground?: string;
  transcriptOverlayPadding?: number | string;
  transcriptVerticalSpacer?: number | string;
  spinnerAnimationBackgroundImage?: string;
  spinnerAnimationHeight?: number;
  spinnerAnimationWidth?: number;
  spinnerAnimationPadding?: number;
  typingAnimationBackgroundImage?: string;
  typingAnimationDuration?: number;
  typingAnimationHeight?: number;
  typingAnimationWidth?: number;
  [key: string]: string | number | boolean | undefined;
}

export const defaultStyleOptions: WebChatStyleOptions = {
  accent: "#0078D4",
  backgroundColor: "#F5F7FB",
  primaryFont: "Inter, 'Segoe UI', system-ui, sans-serif",
  monospaceFont: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace",
  avatarBorderRadius: "50%",
  avatarSize: 36,
  showAvatarInGroup: true,
  botAvatarInitials: "AI",
  botAvatarBackgroundColor: "#0078D4",
  userAvatarInitials: "YO",
  userAvatarBackgroundColor: "#334155",
  bubbleBackground: "#FFFFFF",
  bubbleBorderColor: "#D7E0EA",
  bubbleBorderRadius: 18,
  bubbleTextColor: "#0F172A",
  bubbleFromUserBackground: "#0078D4",
  bubbleFromUserBorderColor: "#006CBE",
  bubbleFromUserBorderRadius: 18,
  bubbleFromUserTextColor: "#FFFFFF",
  bubbleMaxWidth: 420,
  bubbleMinHeight: 38,
  bubbleNubSize: 10,
  bubbleFromUserNubSize: 10,
  paddingRegular: 12,
  paddingWide: 16,
  fontSizeSmall: 13,
  fontSizeMedium: 15,
  hideUploadButton: true,
  hideSendBox: false,
  sendBoxBackground: "#FFFFFF",
  sendBoxBorderTop: "1px solid #D7E0EA",
  sendBoxButtonColor: "#0078D4",
  sendBoxButtonColorOnDisabled: "#94A3B8",
  sendBoxButtonColorOnFocus: "#005EA6",
  sendBoxButtonColorOnHover: "#005EA6",
  sendBoxHeight: 52,
  sendBoxMaxHeight: 180,
  sendBoxPlaceholderColor: "#64748B",
  sendBoxTextColor: "#0F172A",
  suggestedActionBackground: "#FFFFFF",
  suggestedActionBackgroundColor: "#FFFFFF",
  suggestedActionBorderColor: "#C7D7EA",
  suggestedActionBorderRadius: 999,
  suggestedActionTextColor: "#005EA6",
  suggestedActionHeight: 38,
  suggestedActionLayout: "flow",
  suggestedActionSpacing: 8,
  suggestedActionDisabledBackground: "#E2E8F0",
  connectivityIconPadding: 10,
  connectivityMarginLeftRight: 14,
  connectivityMarginTopBottom: 10,
  connectivityTextSize: 13,
  notificationText: "#475569",
  transcriptOverlayBackground: "rgba(248, 250, 252, 0.92)",
  transcriptOverlayPadding: 18,
  transcriptVerticalSpacer: 12,
  spinnerAnimationHeight: 16,
  spinnerAnimationWidth: 48,
  spinnerAnimationPadding: 12,
  typingAnimationDuration: 5000,
  typingAnimationHeight: 20,
  typingAnimationWidth: 48,
};
