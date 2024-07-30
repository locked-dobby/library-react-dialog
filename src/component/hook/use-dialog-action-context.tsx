import React from "react";
import { DialogActionContext, DialogActionContextProviderActions } from "../context/dialog-action-context-provider";

export function useDialogActionContext<DialogResult = void>() {
    const c = React.useContext(DialogActionContext);
    return c as DialogActionContextProviderActions<DialogResult>;
}
