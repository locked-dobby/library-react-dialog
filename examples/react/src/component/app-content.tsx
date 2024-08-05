import { ReactNode } from "react";

import { DialogContextProvider } from "@locked-dobby/library-react-dialog";
import Confirm from "./popup/confirm";
import Alert from "./popup/alert";
import Toast from "./popup/toast";
import { Outlet } from "react-router-dom";

const AppContent = () => {
    return (
        <>
            <DialogContextProvider
                withHistory={true}
                ToastContainer={({ children }: { children: ReactNode }) => {
                    return <div className="toast-container">{children}</div>;
                }}
                Confirm={Confirm}
                Alert={Alert}
                Toast={Toast}>
                <Outlet />
            </DialogContextProvider>
        </>
    );
};

export default AppContent;
