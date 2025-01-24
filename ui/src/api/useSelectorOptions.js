import {useOverallOptions} from "./api.js";
import {useSignal} from "@preact/signals";
import {useEffect} from "preact/hooks";


const useSelectorOptions = (key) => {
    const query = useOverallOptions();
    const options = useSignal({})

    useEffect(() => {
        if (query.data?.data) {
            options.value = query.data.data;
        }
    }, [query.data]);

    return options.value[key] ?? [];
};

export default useSelectorOptions;
