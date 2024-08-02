import { TOAST_DURATION_SHORT, ToastProps, useDialogActionContext } from "@locked-dobby/library-react-dialog";

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
