import { useDialogActionContext, useDialogContext } from "@edge-effect/react-abstract-dialog";
import { useNavigate } from "react-router-dom";
import { getNextUnique } from "../../../script/util/common-utils";

export type RedirectExampleDialogResult = { unique: number };
const RedirectExampleDialog = ({ unique }: { unique: number }) => {
    const { showDialog } = useDialogContext();
    const { hide, doNavigate } = useDialogActionContext<RedirectExampleDialogResult>();
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
                    <h2>Redirect example dialog ({unique})</h2>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={async () => {
                                    showDialog(<RedirectExampleDialog unique={getNextUnique()} />);
                                }}>
                                Open again
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    // keepVisibleDialog does not work with window.location.href.
                                    // keepVisibleDialog default false
                                    doNavigate(() => (window.location.href = "/hello-world"));
                                }}>
                                Redirect to
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    doNavigate(
                                        () => {
                                            navigate("/hello-world");
                                        },
                                        { keepVisibleDialog: true }
                                    );
                                }}>
                                Redirect to (keep)
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
};

export default RedirectExampleDialog;
