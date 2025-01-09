import {ProgressBar} from "react-loader-spinner";


const Loader = ({size, ...props}) =>
    <ProgressBar
        height={props.size ?? 80}
        width={props.size ?? 80}
        borderColor="#8822DD"
        barColor="#DD22DDDD"
        ariaLabel="progress-bar-loading"
        visible={true}
        {...props}
    />;


export default Loader;
