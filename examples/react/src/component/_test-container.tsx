import { useDialogContext } from "@edge-effect/react-abstract-dialog";
import MyCustomDialog, { MyCustomDialogResult } from "./popup/_my-custom-dialog";

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

const TestContainer = () => {
    const { confirm, alert, toast, showDialog } = useDialogContext();
    return (
        <>
            <ul>
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
            </ul>
        </>
    );
};

export default TestContainer;
