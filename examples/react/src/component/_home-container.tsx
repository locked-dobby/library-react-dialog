import { useDialogContext } from "@edge-effect/react-abstract-dialog";
import MyCustomDialog, { MyCustomDialogResult } from "./popup/custom/my-custom-dialog";
import RedirectExampleDialog from "./popup/custom/redirect-example-dialog";

const choices = [
    { id: 1, display: "Apple" },
    { id: 2, display: "Avocado" },
    { id: 3, display: "Bananas" },
    { id: 4, display: "Cherries" },
    { id: 5, display: "Blueberries" },
    { id: 6, display: "Apricots" },
    { id: 7, display: "Mango" },
    { id: 8, display: "Oranges" },
    { id: 9, display: "Blackberry" },
];

const HomeContainer = () => {
    const { confirm, alert, toast, showDialog } = useDialogContext();
    return (
        <>
            <h1>Dialog context example</h1>
            <ul>
                <li>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={async () => {
                                    if (await confirm({ title: "Hello", message: "Select your answer" })) {
                                        console.log("result is true");
                                    } else {
                                        console.log("result is false");
                                    }
                                }}>
                                Show confirm
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={async () => {
                                    if (await confirm({ title: "Hello", message: "Select your answer" })) {
                                        if (await confirm({ title: "Hello again!", message: "Select your answer please..." })) {
                                            console.log("result2 is true");
                                        } else {
                                            console.log("result2 is false");
                                        }
                                    } else {
                                        console.log("result is false");
                                    }
                                }}>
                                Show confirm and again
                            </button>
                        </li>
                    </ul>
                </li>
                <li>
                    <button
                        onClick={async () => {
                            await alert({ title: "Oh...", message: "Are you sure?" });
                        }}>
                        Show alert
                    </button>
                </li>
                <li>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={() => {
                                    const pickedChoice = choices[Math.floor(Math.random() * choices.length)];
                                    toast({ message: `The ${pickedChoice.display} job is done!` });
                                }}>
                                Show toast
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    const pickedChoice = choices[Math.floor(Math.random() * choices.length)];
                                    toast({ unique: "my-unique", message: `The ${pickedChoice.display} job is done!` });
                                }}>
                                Show toast (single context)
                            </button>
                        </li>
                    </ul>
                </li>
                <li>
                    <button
                        onClick={async () => {
                            const dialog = await showDialog<MyCustomDialogResult>(<MyCustomDialog choices={choices} />);
                            console.log("result", dialog.result);
                        }}>
                        Show custom dialog
                    </button>
                </li>
                <li>
                    <button
                        onClick={async () => {
                            const dialog = await showDialog(<RedirectExampleDialog />);
                            console.log("result", dialog.result);
                        }}>
                        Show redirect example
                    </button>
                </li>
            </ul>
        </>
    );
};

export default HomeContainer;
