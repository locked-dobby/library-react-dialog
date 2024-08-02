import React, { ComponentType, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DialogActionContextProvider } from "./dialog-action-context-provider";
import {
    Dialog,
    DIALOG_TYPE_ALERT,
    DIALOG_TYPE_CONFIRM,
    DIALOG_TYPE_TOAST,
    DialogOptions,
    ControlOptions,
    ShowDialogResult,
    ShowToastProps,
    UpdateDialog,
} from "../interface/abstract-dialog-interfaces";
import { ConfirmProps, ConfirmResult } from "../interface/confirm-interfaces";
import { AlertProps } from "../interface/alert-interfaces";
import { selectComponent } from "../../script/util/component-utils";
import { ToastProps } from "../interface/toast-interfaces";
import DefaultDialogContentContainer from "../common/default-dialog-content-container";

// TODO restore visible dialogs when navigate and back

let lastDialogId = 0;

type DialogContentContainer = ComponentType<{ children: ReactNode }>;

interface DialogContextProviderProps {
    withHistory?: boolean;
    withHistoryForwardRestore?: boolean; // default false
    historySearchParamKey?: string;
    visibleMultipleDialog?: boolean; // default true
    DialogContainer?: DialogContentContainer;
    ToastContainer?: DialogContentContainer;
    Alert?: ComponentType<AlertProps>;
    Confirm?: ComponentType<ConfirmProps>;
    Toast?: ComponentType<ToastProps>;
    onInterceptScrollBlocking?: (visibleDialogs: Array<Dialog>, visibleToasts: Array<Dialog>) => void;
    children?: ReactNode;
}

export interface DialogContextProviderActions {
    showDialog: <DialogResult = unknown>(element: ReactNode, options?: DialogOptions) => Promise<ShowDialogResult<DialogResult | undefined>>;
    hideDialog: (id: number, controlOptions?: ControlOptions) => Promise<void>;
    hideDialogAll: (controlOptions?: ControlOptions) => Promise<void>;
    confirm: (args: ConfirmProps, controlOptions?: ControlOptions) => Promise<ConfirmResult>;
    alert: (args: AlertProps, controlOptions?: ControlOptions) => Promise<void>;
    toast: (args: ShowToastProps, controlOptions?: ControlOptions) => void;
    findDialogById: (id: number) => Dialog | undefined;
    updateDialog: (id: number, update: UpdateDialog) => boolean;
}

export const DialogContext = React.createContext<DialogContextProviderActions>({} as DialogContextProviderActions);

export const DialogContextProvider = ({
    withHistory = false,
    withHistoryForwardRestore = false,
    historySearchParamKey = "dialog",
    visibleMultipleDialog = true,
    DialogContainer = DefaultDialogContentContainer,
    ToastContainer = DefaultDialogContentContainer,
    Alert,
    Confirm,
    Toast,
    onInterceptScrollBlocking,
    children,
}: DialogContextProviderProps) => {
    const [dialogs, setDialogs] = useState<Array<Dialog<any>>>([]);

    const lastVisibleDialogId = useRef<number>(0);
    const beforeOverflow = useRef<string>("");

    const backPromiseResolver = useRef<() => void>();

    const addHistory = useCallback(
        (dialogId: number) => {
            const url = new URL(window.location.href);
            url.searchParams.set(historySearchParamKey, dialogId.toString());
            window.history.pushState({}, "", url);
        },
        [historySearchParamKey]
    );

    const showDialog = useCallback(
        async <DialogResult = unknown,>(
            element: ReactNode,
            { ignoreHistory = false, ...options }: DialogOptions = { ignoreHistory: false }
        ): Promise<ShowDialogResult<DialogResult | undefined>> => {
            const dialogOptions: DialogOptions = { ...options, ignoreHistory };

            let createdId: number;
            let resolve: ((value: ShowDialogResult<DialogResult | undefined> | PromiseLike<ShowDialogResult<DialogResult | undefined>>) => void) | undefined =
                undefined;
            const promise = new Promise<ShowDialogResult<DialogResult | undefined>>((_resolve) => {
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
                    options: dialogOptions,
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
                    options: dialogOptions,
                };
                setDialogs((prevDialogs) => {
                    return [...prevDialogs, createdDialog];
                });
            }

            if (!ignoreHistory && withHistory) {
                addHistory(createdDialog.id);
            }
            lastVisibleDialogId.current = createdDialog.id;

            return promise;
        },
        [addHistory, dialogs, withHistory]
    );

    const hideDialog = useCallback(
        async (id: number, { ignoreHistory = false }: ControlOptions = { ignoreHistory: false }) => {
            let promise: Promise<void> | undefined;
            const hideTarget: Dialog<undefined> | undefined = dialogs.find((dialog) => dialog.id === id);
            if (hideTarget) {
                if (!(hideTarget.options?.ignoreHistory ?? false) && !ignoreHistory && withHistory) {
                    window.history.go(-1);

                    promise = new Promise<void>((resolve) => {
                        backPromiseResolver.current = () => resolve();
                    });
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

            if (promise) {
                await promise;
            }
        },
        [dialogs, withHistory]
    );

    const hideDialogAll = useCallback(
        async ({ ignoreHistory = false }: ControlOptions = { ignoreHistory: false }) => {
            let promise: Promise<void> | undefined;
            const hideTargets: Array<Dialog> = dialogs.filter((dialog) => dialog.visible);
            const backwardDelta = hideTargets.reduce((acc, hideTarget) => {
                return acc + (!(hideTarget.options?.ignoreHistory ?? false) ? 1 : 0);
            }, 0);
            if (!ignoreHistory && withHistory && hideTargets.length > 0) {
                if (backwardDelta !== 0) {
                    window.history.go(-backwardDelta);
                }

                promise = new Promise<void>((resolve) => {
                    backPromiseResolver.current = () => {
                        resolve();
                    };
                });
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

            if (promise) {
                await promise;
            }
        },
        [dialogs, withHistory]
    );

    const confirm = useCallback(
        async (args: ConfirmProps, controlOptions?: ControlOptions): Promise<ConfirmResult> => {
            if (Confirm === undefined) throw new Error("Confirm component is not set.");
            const dialogResult = await showDialog<ConfirmResult>(<Confirm {...args} />, {
                ...controlOptions,
                dialogType: DIALOG_TYPE_CONFIRM,
            });
            return dialogResult.result!;
        },
        [Confirm, showDialog]
    );

    const alert = useCallback(
        async (args: AlertProps, controlOptions?: ControlOptions): Promise<void> => {
            if (Alert === undefined) throw new Error("Alert component is not set.");
            await showDialog<void>(<Alert {...args} />, {
                ...controlOptions,
                dialogType: DIALOG_TYPE_ALERT,
            });
        },
        [Alert, showDialog]
    );

    const toast = useCallback(
        (args: ShowToastProps, controlOptions: ControlOptions = { ignoreHistory: true }) => {
            if (Toast === undefined) throw new Error("Toast component is not set.");
            const { unique, ...rest } = args;
            void showDialog(<Toast {...rest} />, {
                ...controlOptions,
                dialogType: DIALOG_TYPE_TOAST,
                unique,
            });
        },
        [Toast, showDialog]
    );

    const dialogContents = useMemo(() => {
        if (visibleMultipleDialog) {
            // multiple visible dialogs
            return dialogs
                .filter((dialog) => dialog.visible && dialog.options?.dialogType !== DIALOG_TYPE_TOAST)
                .map((dialog) => {
                    return (
                        <Fragment key={dialog.id}>
                            <DialogActionContextProvider id={dialog.id}>{dialog.element}</DialogActionContextProvider>
                        </Fragment>
                    );
                });
        } else {
            // single visible dialog
            const foundLastVisibleDialog = dialogs.findLast((dialog) => dialog.visible && dialog.options?.dialogType !== DIALOG_TYPE_TOAST);
            if (foundLastVisibleDialog !== undefined) {
                return [
                    <Fragment key={foundLastVisibleDialog.id}>
                        <DialogActionContextProvider id={foundLastVisibleDialog.id}>{foundLastVisibleDialog.element}</DialogActionContextProvider>
                    </Fragment>,
                ];
            } else {
                return [];
            }
        }
    }, [dialogs, visibleMultipleDialog]);

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
        if (withHistory) {
            // event: PopStateEvent
            const onPopState = () => {
                backPromiseResolver.current && backPromiseResolver.current();

                const url = new URL(window.location.href);
                const currentDialogId = Number(url.searchParams.get(historySearchParamKey)) || 0;
                const currentDialog = dialogs.find((dialog) => dialog.id === currentDialogId);
                const lastVisibleDialog = dialogs.find((dialog) => dialog.id === lastVisibleDialogId.current);

                let doHistoryWork = true;
                if (currentDialogId >= lastVisibleDialogId.current) {
                    // forward
                    if (!withHistoryForwardRestore) {
                        doHistoryWork = false;
                    }
                } else {
                    // backward
                }

                if (doHistoryWork) {
                    if (lastVisibleDialog !== undefined && lastVisibleDialog.visible) {
                        lastVisibleDialog.resolve({
                            id: lastVisibleDialog.id,
                            result: undefined,
                        });
                        updateDialog(lastVisibleDialogId.current, { visible: false });
                    }
                    if (currentDialog !== undefined && !currentDialog.visible) {
                        updateDialog(currentDialogId, { visible: true });
                    }
                }
                lastVisibleDialogId.current = currentDialogId;
            };
            window.addEventListener("popstate", onPopState);
            return () => {
                window.removeEventListener("popstate", onPopState);
            };
        }
    }, [dialogs, hideDialog, updateDialog, historySearchParamKey, withHistory, withHistoryForwardRestore]);

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
