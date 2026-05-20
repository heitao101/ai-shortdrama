"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MAX_REFERENCE_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ReferenceImage = {
  id: string;
  file: File;
  preview: string;
};

type ImageUploadProps = {
  images: ReferenceImage[];
  onChange: (images: ReferenceImage[]) => void;
  className?: string;
};

export function ImageUpload({ images, onChange, className }: ImageUploadProps) {
  const t = useTranslations("generator");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;

      const remaining = MAX_REFERENCE_IMAGES - images.length;
      const toAdd = Array.from(files).slice(0, remaining);

      const newImages: ReferenceImage[] = toAdd.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }));

      onChange([...images, ...newImages]);
    },
    [images, onChange]
  );

  const removeImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    onChange(images.filter((img) => img.id !== id));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium text-foreground">
        {t("imagesLabel")}
      </Label>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() =>
          images.length < MAX_REFERENCE_IMAGES && inputRef.current?.click()
        }
        className={cn(
          "relative flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-5 transition-colors hover:border-brand-200 hover:bg-accentBlue-50/50",
          images.length >= MAX_REFERENCE_IMAGES &&
            "pointer-events-none opacity-60"
        )}
      >
        <ImagePlus className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          {t("imagesHint", { max: MAX_REFERENCE_IMAGES })}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card shadow-soft"
            >
              <Image
                src={img.preview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 shadow-soft transition group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
