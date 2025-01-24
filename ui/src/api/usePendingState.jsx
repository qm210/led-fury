import {useCallback, useState} from "react";

export const usePendingState = () => {
    const [pending, setPending] = useState(false);

    const withPendingState = useCallback(async (func) => {
        setPending(true);
        await func();
        setPending(false);
    }, []);

    return [pending, withPendingState];
};
