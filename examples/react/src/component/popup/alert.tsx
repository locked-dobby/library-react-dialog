import { AlertProps, useDialogActionContext } from "@locked-dobby/library-react-dialog";

const Alert = ({ title, message, textOk = "ok" }: AlertProps) => {
    const { hide } = useDialogActionContext();
    return (
        <>
            <section className="dialog">
                <div
                    className="dialog-dimmed"
                    onClick={() => {
                        hide();
                    }}
                />
                <div className="dialog-content">
                    <h1>{title}</h1>
                    <h2>{message}</h2>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={() => {
                                    hide();
                                }}>
                                {textOk}
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
};

export default Alert;
