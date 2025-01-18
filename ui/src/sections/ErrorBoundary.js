import {useErrorBoundary} from "preact/hooks";

const ErrorBoundary = ({children}) => {
    const [error, resetError] = useErrorBoundary();

    if (error) {
        return (
            <div>
                <div>
                    Backend unreponsive.
                </div>
                <div>
                    {JSON.stringify(error)}
                </div>
            </div>
        );
    }
    return children;
};

export default ErrorBoundary;
