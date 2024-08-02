import { ConfirmProps, useDialogActionContext } from "@locked-dobby/library-react-dialog";

const Confirm = ({ title, message, textYes = "yes", textNo = "no" }: ConfirmProps) => {
    const { hide } = useDialogActionContext<boolean>();
    return (
        <>
            <section className="dialog">
                <div
                    className="dialog-dimmed"
                    onClick={() => {
                        hide(false);
                    }}
                />
                <div className="dialog-content">
                    <h1>{title}</h1>
                    <h2>{message}</h2>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={() => {
                                    hide(false);
                                }}>
                                {textNo}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    hide(true);
                                }}>
                                {textYes}
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
};

export default Confirm;
