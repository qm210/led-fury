export const ActionButtonRow = ({actions, className = ""}) =>
    <div className={"flex flex-row gap-2 w-full justify-between " + className}>
        {
            actions.map((button, index) =>
                <button
                    class={"p-2"}
                    onClick={button.onClick}
                    title={button.tooltip}
                    style={button.style}
                    key={index}
                    disabled={button.disabled}
                >
                    <button.element/>
                </button>
            )
        }
    </div>;
