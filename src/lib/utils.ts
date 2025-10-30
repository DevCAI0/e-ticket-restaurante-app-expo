// src/lib/utils.ts
// Função cn simplificada para React Native (sem twMerge)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
