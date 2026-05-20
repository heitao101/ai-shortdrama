/** Clerk UI — soft bright professional (Notion / Linear style) */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#4F46E5",
    colorBackground: "#F8FAFC",
    colorInputBackground: "#FFFFFF",
    colorText: "#0F172A",
    colorTextSecondary: "#64748B",
    colorDanger: "#EF4444",
    borderRadius: "0.875rem",
  },
  elements: {
    formButtonPrimary:
      "bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium shadow-soft normal-case",
    card: "bg-white border border-[#E2E8F0] shadow-card rounded-2xl",
    headerTitle: "text-[#0F172A] font-semibold",
    headerSubtitle: "text-[#64748B]",
    socialButtonsBlockButton:
      "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]",
    formFieldInput:
      "border border-[#E2E8F0] bg-white text-[#0F172A] focus:ring-2 focus:ring-[#4F46E5]/15 focus:border-[#4F46E5]",
    footerActionLink: "text-[#4F46E5] hover:text-[#4338CA]",
    identityPreviewEditButton: "text-[#4F46E5]",
    formFieldLabel: "text-[#0F172A] font-medium",
    dividerLine: "bg-[#E2E8F0]",
    dividerText: "text-[#94A3B8]",
    navbar: "bg-[#F8FAFC]",
  },
} as const;
