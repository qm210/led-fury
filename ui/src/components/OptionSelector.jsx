import useSelectorOptions from "../api/useSelectorOptions.js";

export const OptionSelector = ({optionsKey, value, onChange}) => {
    const options = useSelectorOptions(optionsKey);

    const onChangeMaybe = (event) => {
        const newValue = event.target.value;
        if (value === newValue) {
            return;
        }
        onChange(newValue);
    };

    return (
        <select
            value={value}
            onChange={onChangeMaybe}
        >
            {
                options.map(option =>
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.name}
                    </option>
                )
            }
        </select>
    );
};
