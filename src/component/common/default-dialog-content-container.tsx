import React from "react";
import { ReactNode } from "react";

const DefaultDialogContentContainer = ({ className, children }: { className?: string; children: ReactNode }) => {
    return <div className={className}>{children}</div>;
};

export default DefaultDialogContentContainer;
