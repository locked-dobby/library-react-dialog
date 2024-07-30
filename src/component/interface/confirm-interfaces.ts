export const CONFIRM_RESULT_POSITIVE = true;
export const CONFIRM_RESULT_NEGATIVE = false;
export type ConfirmResult = typeof CONFIRM_RESULT_POSITIVE | typeof CONFIRM_RESULT_NEGATIVE;

export interface ConfirmProps {
    title: string;
    message: string;
    textYes?: string;
    textNo?: string;
}
