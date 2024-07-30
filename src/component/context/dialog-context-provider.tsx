import React, { ComponentType, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DialogActionContextProvider } from "./dialog-action-context-provider";
import {
    Dialog,
    DIALOG_TYPE_ALERT,
    DIALOG_TYPE_CONFIRM,
    DIALOG_TYPE_TOAST,
    DialogOptions,
    ShowDialogResult,
    ShowToastProps,
    UpdateDialog,
} from "../interface/abstract-dialog-interfaces";
import { ConfirmProps, ConfirmResult } from "../interface/confirm-interfaces";
import { AlertProps } from "../interface/alert-interfaces";
import { selectComponent } from "../../script/util/component-utils";
import { ToastProps } from "../interface/toast-interfaces";
import DefaultDialogContentContainer from "../common/default-dialog-content-container";

let lastDialogId = 0;

type DialogContentContainer = ComponentType<{ children: ReactNode }>;

interface DialogContextProviderProps {
    DialogContainer?: DialogContentContainer;
    ToastContainer?: DialogContentContainer;
    Alert?: ComponentType<AlertProps>;
    Confirm?: ComponentType<ConfirmProps>;
    Toast?: ComponentType<ToastProps>;
    onInterceptScrollBlocking?: (visibleDialogs: Array<Dialog>, visibleToasts: Array<Dialog>) => void;
    children?: ReactNode;
}

export interface DialogContextProviderActions {
    showDialog: <DialogResult = void>(element: ReactNode, options?: DialogOptions) => Promise<ShowDialogResult<DialogResult>>;
    hideDialog: (id: number) => void;
    hideDialogAll: () => void;
    confirm: (args: ConfirmProps) => Promise<ConfirmResult>;
    alert: (args: AlertProps) => Promise<void>;
    toast: (args: ShowToastProps) => void;
    findDialogById: (id: number) => Dialog | undefined;
    updateDialog: (id: number, update: UpdateDialog) => boolean;
}

export const DialogContext = React.createContext<DialogContextProviderActions>({} as DialogContextProviderActions);

export const DialogContextProvider = ({
    DialogContainer = DefaultDialogContentContainer,
    ToastContainer = DefaultDialogContentContainer,
    Alert,
    Confirm,
    Toast,
    onInterceptScrollBlocking,
    children,
}: DialogContextProviderProps) => {
    const [dialogs, setDialogs] = useState<Array<Dialog<any>>>([]);

    const beforeOverflow = useRef<string>("");

    // scroll blocking
    useEffect(() => {
        if (onInterceptScrollBlocking) {
            onInterceptScrollBlocking(
                dialogs.filter((dialog) => dialog.visible && dialog.options?.dialogType !== DIALOG_TYPE_TOAST),
                dialogs.filter((dialog) => dialog.visible && dialog.options?.dialogType === DIALOG_TYPE_TOAST)
            );
        } else {
            const visibleDialogCount =
                dialogs.reduce((acc, dialog) => {
                    return acc + (dialog.options?.dialogType !== DIALOG_TYPE_TOAST && dialog.visible ? 1 : 0);
                }, 0) ?? 0;

            if (visibleDialogCount > 0) {
                const currentOverflow = window.document.body.style.overflow;
                if (currentOverflow !== "hidden") {
                    beforeOverflow.current = currentOverflow;
                }
                window.document.body.style.overflow = "hidden";
            } else {
                if (beforeOverflow.current) {
                    window.document.body.style.overflow = beforeOverflow.current;
                } else {
                    window.document.body.style.removeProperty("overflow");
                }
            }
        }
    }, [dialogs, dialogs.length, onInterceptScrollBlocking]);

    const showDialog = useCallback(
        <DialogResult,>(element: ReactNode, options?: DialogOptions): Promise<ShowDialogResult<DialogResult>> => {
            let createdId: number;
            let resolve: (value: ShowDialogResult<DialogResult> | PromiseLike<ShowDialogResult<DialogResult>>) => void;
            const promise = new Promise<ShowDialogResult<DialogResult>>((_resolve) => {
                resolve = _resolve;
            });

            const foundDialogByUnique = options?.unique !== undefined ? dialogs.find((dialog) => dialog.options?.unique === options.unique) : undefined;
            if (foundDialogByUnique) {
                setDialogs((prevDialogs) => {
                    return prevDialogs.map((prevDialog) => {
                        if (prevDialog.id === foundDialogByUnique.id) {
                            return { ...prevDialog, element, resolve, visible: true };
                        } else {
                            return prevDialog;
                        }
                    });
                });
            } else {
                setDialogs((prevDialogs) => {
                    lastDialogId++;
                    createdId = lastDialogId;

                    const dialog: Dialog<DialogResult> = {
                        id: createdId,
                        element,
                        visible: true,
                        resolve,
                        options,
                    };

                    return [...prevDialogs, dialog];
                });
            }

            return promise;
        },
        [dialogs]
    );

    const hideDialog = useCallback((id: number) => {
        setDialogs((prevDialogs) => {
            return prevDialogs.map((dialog) => {
                const flag = dialog.id === id;
                if (flag) {
                    dialog.options?.onDismiss && dialog.options?.onDismiss();
                    return {
                        ...dialog,
                        visible: false,
                    };
                } else {
                    return dialog;
                }
            });
        });
    }, []);

    const hideDialogAll = useCallback(() => {
        setDialogs((prevDialogs) => {
            return prevDialogs.map((dialog) => {
                if (dialog.visible) {
                    // execute callback cause invisible target
                    dialog.options?.onDismiss && dialog.options?.onDismiss();
                }
                return {
                    ...dialog,
                    visible: false,
                };
            });
        });
    }, []);

    const confirm = useCallback(
        async (args: ConfirmProps): Promise<ConfirmResult> => {
            if (Confirm === undefined) throw new Error("Confirm component is not set.");
            const dialogResult = await showDialog<ConfirmResult>(<Confirm {...args} />, {
                dialogType: DIALOG_TYPE_CONFIRM,
            });
            return dialogResult.result!;
        },
        [Confirm, showDialog]
    );

    const alert = useCallback(
        async (args: AlertProps): Promise<void> => {
            if (Alert === undefined) throw new Error("Alert component is not set.");
            await showDialog<void>(<Alert {...args} />, {
                dialogType: DIALOG_TYPE_ALERT,
            });
        },
        [Alert, showDialog]
    );

    const toast = useCallback(
        (args: ShowToastProps) => {
            if (Toast === undefined) throw new Error("Toast component is not set.");
            const { unique, ...rest } = args;
            void showDialog(<Toast {...rest} />, {
                dialogType: DIALOG_TYPE_TOAST,
                unique,
            });
        },
        [Toast, showDialog]
    );

    const dialogContents = useMemo(() => {
        return dialogs
            ?.filter((dialog) => dialog.visible && dialog.options?.dialogType !== DIALOG_TYPE_TOAST)
            .map((dialog) => {
                return (
                    <Fragment key={dialog.id}>
                        <DialogActionContextProvider id={dialog.id}>{dialog.element}</DialogActionContextProvider>
                    </Fragment>
                );
            });
    }, [dialogs]);

    const toastContents = useMemo(() => {
        return dialogs
            ?.filter((dialog) => dialog.visible && dialog.options?.dialogType === DIALOG_TYPE_TOAST)
            .map((dialog) => {
                return (
                    <Fragment key={dialog.id}>
                        <DialogActionContextProvider id={dialog.id}>{dialog.element}</DialogActionContextProvider>
                    </Fragment>
                );
            });
    }, [dialogs]);

    const findDialogById = useCallback(
        (id: number) => {
            return dialogs.find((dialog) => dialog.id === id);
        },
        [dialogs]
    );

    const updateDialog = useCallback(
        (id: number, update: UpdateDialog) => {
            const found = findDialogById(id);
            if (found) {
                setDialogs((prevDialogs) => {
                    return prevDialogs.map((prevDialog) => {
                        if (prevDialog.id === found.id) {
                            return { ...prevDialog, ...update };
                        } else {
                            return prevDialog;
                        }
                    });
                });
                return true;
            } else {
                return false;
            }
        },
        [findDialogById]
    );

    const actions = useMemo<DialogContextProviderActions>(() => {
        return {
            showDialog,
            hideDialog,
            hideDialogAll,
            confirm,
            alert,
            toast,
            findDialogById,
            updateDialog,
        };
    }, [alert, confirm, findDialogById, hideDialog, hideDialogAll, updateDialog, showDialog, toast]);

    return (
        <DialogContext.Provider value={actions}>
            {children}
            {selectComponent(toastContents.length > 0, () => (
                <ToastContainer>{toastContents}</ToastContainer>
            ))}
            {selectComponent(dialogContents.length > 0, () => (
                <DialogContainer>{dialogContents}</DialogContainer>
            ))}
        </DialogContext.Provider>
    );
};
