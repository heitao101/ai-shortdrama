import type { DramaStyleId } from "@/lib/constants";
import {
  generateKlingVideo,
  type KlingGenerateInput,
  type KlingGenerateResult,
  type ReferenceImageInput,
} from "@/lib/kling-api";

export type { ReferenceImageInput };

export type GenerateVideoInput = KlingGenerateInput & {
  style: DramaStyleId;
};

export type GenerateVideoOutput = {
  videoUrl: string;
  model: string;
  taskId?: string;
  durationSeconds: number;
};

export async function generateDramaVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const result: KlingGenerateResult = await generateKlingVideo(input);
  return {
    videoUrl: result.videoUrl,
    model: result.modelName,
    taskId: result.taskId,
    durationSeconds: result.durationSeconds,
  };
}
