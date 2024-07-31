import { useDialogActionContext, useDialogContext } from "@edge-effect/react-abstract-dialog";
import { useNavigate } from "react-router-dom";

const RedirectExampleDialog = () => {
    const { showDialog } = useDialogContext();
    const { hide, doNavigate } = useDialogActionContext();
    const navigate = useNavigate();

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
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={() => {
                                    showDialog(<RedirectExampleDialog />);
                                }}>
                                Open again
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    doNavigate(() => (window.location.href = "/hello-world"));
                                }}>
                                Redirect to
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    doNavigate(() => {
                                        console.log(2);
                                        navigate("/hello-world");
                                    });
                                }}>
                                Redirect to (2)
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
};

export default RedirectExampleDialog;
