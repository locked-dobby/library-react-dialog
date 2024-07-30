import "./App.css";
import { DialogContextProvider } from "@edge-effect/react-abstract-dialog";
import TestContainer from "./component/_test-container";
import Confirm from "./component/popup/confirm";
import Alert from "./component/popup/alert";
import Toast from "./component/popup/toast";
import { ReactNode } from "react";

function App() {
    return (
        <>
            <DialogContextProvider
                ToastContainer={({ children }: { children: ReactNode }) => {
                    return <div className="toast-container">{children}</div>;
                }}
                Confirm={Confirm}
                Alert={Alert}
                Toast={Toast}>
                <h1>Dialog context example</h1>
                <TestContainer />
            </DialogContextProvider>
        </>
    );
}

export default App;
