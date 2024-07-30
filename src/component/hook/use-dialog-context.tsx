import React from "react";
import { DialogContext } from "../context/dialog-context-provider";

export function useDialogContext() {
    const c = React.useContext(DialogContext);
    return c;
}
