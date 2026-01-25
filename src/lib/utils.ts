import { clsx } from 'clsx'

type ClassValue = string | number | null | undefined | Record<string, boolean>

export const cn = (...inputs: ClassValue[]) => clsx(inputs)
