import * as Lucide from "lucide-preact";
import {useOverallMutations} from "../api/apiHooks.js";

export const ControlButtons = ({sequence}) => {
    const {storeToFile} = useOverallMutations();

    return (
        <div className="flex flex-row gap-2 w-full justify-start">
            <button className="p-2">
                <Lucide.Play/>
            </button>
            <div className="flex-1"/>
            <button
                className="p-2"
                onClick={() => storeToFile("test.fury")}
            >
                <Lucide.Save/>
            </button>
        </div>
    );
};
