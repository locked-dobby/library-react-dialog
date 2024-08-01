import { TOAST_DURATION_SHORT, ToastProps, useDialogActionContext } from "@edge-effect/react-abstract-dialog";

const Toast = ({ message, duration = TOAST_DURATION_SHORT }: ToastProps) => {
    useDialogActionContext({
        hideDuration: duration,
    });

    return (
        <>
            <p className="toast-content">{message}</p>
        </>
    );
};

export default Toast;
