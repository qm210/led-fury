export const ActionButtons = ({actions, className = ""}) =>
    <div className={"flex flex-row gap-2 w-full " + className}>
        {
            actions.map((button, index) =>
                <ActionButton
                    onClick={button.onClick}
                    tooltip={button.tooltip}
                    style={button.style}
                    disabled={button.disabled ?? false}
                    children={<button.element/>}
                    key={index}
                />
            )
        }
    </div>;

export const ActionButton = ({onClick, tooltip, style, disabled, children}) =>
    <button
        className={"p-2"}
        onClick={onClick}
        title={tooltip}
        style={style}
        disabled={disabled}
    >
        {children}
    </button>;

