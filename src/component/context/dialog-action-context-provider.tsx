import React, { ReactNode, useCallback, useMemo, useRef } from "react";
import { useDialogContext } from "../hook/use-dialog-context";

interface DialogActionContextProviderProps {
    id: number;
    children?: ReactNode;
}

export interface DialogActionContextProviderActions<DialogResult> {
    hide: (result: DialogResult) => void;
    hideAfter: (afterMilliseconds: number, result: DialogResult) => void;
}

export const DialogActionContext = React.createContext<DialogActionContextProviderActions<any>>({} as DialogActionContextProviderActions<unknown>);

export const DialogActionContextProvider = <DialogResult,>({ id, children }: DialogActionContextProviderProps) => {
    const { hideDialog, findDialogById } = useDialogContext();
    const hideWorkerId = useRef<ReturnType<typeof setTimeout>>();

    const hide = useCallback(
        (result?: DialogResult) => {
            const dialog = findDialogById(id);
            if (dialog) {
                dialog.resolve({
                    id,
                    result,
                });
            }
            hideDialog(id);
        },
        [findDialogById, hideDialog, id]
    );

    const hideAfter = useCallback(
        (afterMilliseconds: number, result?: DialogResult) => {
            if (hideWorkerId.current) {
                clearTimeout(hideWorkerId.current);
            }

            hideWorkerId.current = setTimeout(() => {
                const dialog = findDialogById(id);
                if (dialog) {
                    dialog.resolve({
                        id,
                        result,
                    });
                }
                hideDialog(id);
                hideWorkerId.current = undefined;
            }, afterMilliseconds);
        },
        [findDialogById, hideDialog, id]
    );

    const actions = useMemo<DialogActionContextProviderActions<DialogResult>>(() => {
        return {
            hide,
            hideAfter,
        };
    }, [hide, hideAfter]);

    return <DialogActionContext.Provider value={actions}>{children}</DialogActionContext.Provider>;
};
