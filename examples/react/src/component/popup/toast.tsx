import { TOAST_DURATION_SHORT, ToastProps, useDialogActionContext } from "@edge-effect/react-abstract-dialog";
import { useEffect } from "react";

const Toast = ({ message, duration = TOAST_DURATION_SHORT }: ToastProps) => {
    const { hideAfter } = useDialogActionContext();

    useEffect(() => {
        hideAfter(duration);
    }, [duration, hideAfter]);

    return (
        <>
            <p className="toast-content">{message}</p>
        </>
    );
};

export default Toast;
