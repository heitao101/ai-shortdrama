"use client";

import { GenerateButton } from "./generate-button";

type Props = {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function GenerateAction(props: Props) {
  return <GenerateButton {...props} />;
}
