"use client";

import { useTranslations } from "next-intl";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function GenerateButton({
  canGenerate,
  isGenerating,
  onGenerate,
}: Props) {
  const t = useTranslations("generator");
  const label = isGenerating ? t("generating") : t("generate");
  const Icon = isGenerating ? Loader2 : Wand2;

  return (
    <Button
      variant="default"
      size="xl"
      className="w-full gap-2 sm:w-auto sm:min-w-[260px]"
      disabled={!canGenerate}
      onClick={onGenerate}
    >
      <Icon className={`h-5 w-5 ${isGenerating ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
