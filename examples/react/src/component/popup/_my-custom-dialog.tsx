import { useDialogActionContext } from "@edge-effect/react-abstract-dialog";
import { useRef } from "react";

type Choice = { id: number; display: string };

export type MyCustomDialogResult = Array<Choice>;

interface MyCustomDialogProps {
    choices: Array<Choice>;
}

const MyCustomDialog = ({ choices }: MyCustomDialogProps) => {
    const { hide } = useDialogActionContext<MyCustomDialogResult>();

    const checkedChoiceInfo = useRef<{ [id: string]: { isChecked: boolean; data: Choice } }>({});

    return (
        <>
            <section className="dialog">
                <div
                    className="dialog-dimmed"
                    onClick={() => {
                        hide([]);
                    }}
                />
                <div className="dialog-content">
                    <h1>Select your choice</h1>
                    <ul>
                        {choices.map((choice) => {
                            const checkboxId = `checkboxId-${choice.id}-${choice.display}`;
                            return (
                                <li key={choice.id}>
                                    <input
                                        type="checkbox"
                                        id={checkboxId}
                                        value={choice.id}
                                        onChange={(event) => {
                                            const isChecked = event.target.checked;
                                            if (checkedChoiceInfo.current[event.target.value] !== undefined) {
                                                checkedChoiceInfo.current[event.target.value].isChecked = isChecked;
                                            } else {
                                                checkedChoiceInfo.current[event.target.value] = {
                                                    isChecked: isChecked,
                                                    data: choice,
                                                };
                                            }
                                        }}
                                    />
                                    <label htmlFor={checkboxId}>{choice.display}</label>
                                </li>
                            );
                        })}
                    </ul>
                    <ul className="horizontal">
                        <li>
                            <button
                                onClick={() => {
                                    hide([]);
                                }}>
                                Dismiss
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    const selectedList: MyCustomDialogResult = [];
                                    const entries = Object.entries(checkedChoiceInfo.current);
                                    for (const [, value] of entries) {
                                        if (value.isChecked) {
                                            selectedList.push(value.data);
                                        }
                                    }
                                    hide(selectedList);
                                }}>
                                Select
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
};

export default MyCustomDialog;
