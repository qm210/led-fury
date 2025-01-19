import {ProgressBar} from "react-loader-spinner";
import {useState} from "preact/compat";

const Loader = ({children, ...props}) => {
    const [fontSize, setFontSize] = useState();

    const calculateFontSize = (element) => {
        if (!element) {
            return;
        }
        setFontSize((0.05 * element.offsetHeight).toFixed(1) + "px");
    };

    const size = {
        width: props.width ?? props.size ?? "25%",
        height: props.height ?? props.size ?? "50%"
    };

    return (
        <div
            className = {"relative"}
            style = {size}
            ref = {calculateFontSize}
        >
            <ProgressBar
                className = {"opacity-80"}
                width = {"100%"}
                height = {"100%"}
                borderColor = {"#8822DD"}
                barColor = {"#DD22DD"}
                visible = {true}
                {...props}
            />
            <div className={"absolute top-0 bottom-0 left-0 right-0 content-center opacity-80"}
                style={{
                    color: props.textColor ?? "white",
                    fontSize,
                }}
            >
                {children}
            </div>
        </div>
    );
};


export default Loader;
