import React, { ComponentType, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DialogActionContextProvider } from "./dialog-action-context-provider";
import {
    Dialog,
    DIALOG_TYPE_ALERT,
    DIALOG_TYPE_CONFIRM,
    DIALOG_TYPE_TOAST,
    DialogOptions,
    HideOptions,
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
    experimental_withHistory?: boolean;
    DialogContainer?: DialogContentContainer;
    ToastContainer?: DialogContentContainer;
    Alert?: ComponentType<AlertProps>;
    Confirm?: ComponentType<ConfirmProps>;
    Toast?: ComponentType<ToastProps>;
    onInterceptScrollBlocking?: (visibleDialogs: Array<Dialog>, visibleToasts: Array<Dialog>) => void;
    historySearchParamKey?: string;
    children?: ReactNode;
}

export interface DialogContextProviderActions {
    showDialog: <DialogResult = void>(element: ReactNode, options?: DialogOptions) => Promise<ShowDialogResult<DialogResult>>;
    hideDialog: (id: number, hideOptions?: HideOptions) => void;
    hideDialogAll: (hideOptions?: HideOptions) => void;
    confirm: (args: ConfirmProps) => Promise<ConfirmResult>;
    alert: (args: AlertProps) => Promise<void>;
    toast: (args: ShowToastProps) => void;
    findDialogById: (id: number) => Dialog | undefined;
    updateDialog: (id: number, update: UpdateDialog) => boolean;
}

export const DialogContext = React.createContext<DialogContextProviderActions>({} as DialogContextProviderActions);

export const DialogContextProvider = ({
    experimental_withHistory = false,
    DialogContainer = DefaultDialogContentContainer,
    ToastContainer = DefaultDialogContentContainer,
    Alert,
    Confirm,
    Toast,
    onInterceptScrollBlocking,
    historySearchParamKey = "dialog",
    children,
}: DialogContextProviderProps) => {
    const [dialogs, setDialogs] = useState<Array<Dialog<any>>>([]);

    const lastVisibleDialogId = useRef<number>(0);
    const beforeOverflow = useRef<string>("");

    const addHistory = useCallback(
        (dialogId: number) => {
            const url = new URL(window.location.href);
            url.searchParams.set(historySearchParamKey, dialogId.toString());
            window.history.pushState({}, "", url);
        },
        [historySearchParamKey]
    );

    const showDialog = useCallback(
        async <DialogResult,>(element: ReactNode, options?: DialogOptions): Promise<ShowDialogResult<DialogResult>> => {
            let createdId: number;
            let resolve: ((value: ShowDialogResult<DialogResult> | PromiseLike<ShowDialogResult<DialogResult>>) => void) | undefined = undefined;
            const promise = new Promise<ShowDialogResult<DialogResult>>((_resolve) => {
                resolve = _resolve;
            });

            await new Promise<void>((_resolve) => {
                const resolveSetter = setInterval(() => {
                    if (resolve !== undefined) {
                        _resolve();
                        clearTimeout(resolveSetter);
                    }
                }, 1);
            });
            if (resolve === undefined) throw new Error("Unexpected exception");

            let createdDialog: Dialog<DialogResult>;
            const foundDialogByUnique: Dialog<DialogResult> | undefined =
                options?.unique !== undefined ? dialogs.find((dialog) => dialog.options?.unique === options.unique) : undefined;
            if (foundDialogByUnique) {
                createdDialog = {
                    id: foundDialogByUnique.id,
                    element,
                    visible: true,
                    resolve,
                    options,
                };
                setDialogs((prevDialogs) => {
                    return prevDialogs.map((prevDialog) => {
                        if (prevDialog.id === foundDialogByUnique.id) {
                            return createdDialog;
                        } else {
                            return prevDialog;
                        }
                    });
                });
            } else {
                lastDialogId++;
                createdId = lastDialogId;
                createdDialog = {
                    id: createdId,
                    element,
                    visible: true,
                    resolve,
                    options,
                };
                setDialogs((prevDialogs) => {
                    return [...prevDialogs, createdDialog];
                });
            }

            if (experimental_withHistory) {
                addHistory(createdDialog.id);
            }
            lastVisibleDialogId.current = createdDialog.id;

            return promise;
        },
        [addHistory, dialogs, experimental_withHistory]
    );

    const hideDialog = useCallback(
        (id: number, { ignoreHistory = false }: HideOptions = {}) => {
            const hideTarget = dialogs.find((dialog) => dialog.id === id);
            if (hideTarget) {
                if (!ignoreHistory && experimental_withHistory) {
                    window.history.go(-1);
                }
                hideTarget.options?.onDismiss && hideTarget.options?.onDismiss();

                setDialogs((prevDialogs) => {
                    return prevDialogs.map((dialog) => {
                        if (dialog.id === id) {
                            return {
                                ...dialog,
                                visible: false,
                            };
                        } else {
                            return dialog;
                        }
                    });
                });
            }
        },
        [dialogs, experimental_withHistory]
    );

    const hideDialogAll = useCallback(
        ({ ignoreHistory = false }: HideOptions = {}) => {
            const hideTargets: Array<Dialog> = dialogs.filter((dialog) => dialog.visible);
            if (!ignoreHistory && experimental_withHistory && hideTargets.length > 0) {
                window.history.go(-hideTargets.length);
            }
            if (hideTargets.length > 0)
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
        },
        [dialogs, experimental_withHistory]
    );

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

    // history
    useEffect(() => {
        if (experimental_withHistory) {
            // event: PopStateEvent
            const onPopState = () => {
                const url = new URL(window.location.href);
                const currentDialogId = Number(url.searchParams.get(historySearchParamKey)) || 0;
                const lastVisibleDialog = dialogs.find((dialog) => dialog.id === lastVisibleDialogId.current);
                if (lastVisibleDialog !== undefined && lastVisibleDialog.visible) {
                    hideDialog(lastVisibleDialogId.current, { ignoreHistory: true });
                }
                lastVisibleDialogId.current = currentDialogId;
            };
            window.addEventListener("popstate", onPopState);
            return () => {
                window.removeEventListener("popstate", onPopState);
            };
        }
    }, [dialogs, hideDialog, historySearchParamKey, experimental_withHistory]);

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
