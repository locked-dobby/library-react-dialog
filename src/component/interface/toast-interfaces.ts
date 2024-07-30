export const TOAST_DURATION_SHORT = 1000 * 2;
export const TOAST_DURATION_LONG = 1000 * 3.5;

export interface ToastProps {
    message: string;
    duration?: number;
}
