import { ReactNode } from "react";

export const selectComponent = (flag: boolean, a: () => ReactNode, b?: () => ReactNode): ReactNode | undefined => {
    return flag ? a() : b && b();
};
