interface InputTypes {
    number: string;
    text: string;
    email: string;
    password: string;
}

interface Props<T extends keyof InputTypes> {
    onClick?: () => void;
    disabled?: boolean;
    readonly?: boolean;
    className?: string;
    type?: T;
    placeholder?: string;
    label?: string;
    minLength?: number;
    value?: InputTypes[T];
    height?: number;
    onChange?: (value: InputTypes[T]) => void;

    // for number inputs
    min?: number;
    max?: number;
}

function Input<T extends keyof InputTypes>({
    onClick,
    disabled,
    readonly,
    label,
    type,
    className,
    placeholder,
    minLength,
    value,
    height,
    onChange,

    // for number inputs
    min,
    max,
}: Props<T>) {
    return (
        <>
            <div className={"flex flex-col w-full " + className}>
                <span className="mb-1 text-gray-200">{label}</span>
                <input
                    placeholder={placeholder}
                    type={type}
                    className={`rounded-lg text-sm bg-zinc-700/80 border-zinc-600 border outline-none placeholder:text-white/70 ease-in duration-300 hover:bg-zinc-700 focus:bg-zinc-700 h-${
                        height ?? 9
                    } px-3 disabled:text-gray-400 disabled:bg-zinc-700/50 disabled:cursor-not-allowed`}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange?.(e.target.value as InputTypes[T])}
                    minLength={minLength}
                    readOnly={readonly}
                    min={min}
                    max={max}
                />
            </div>
        </>
    );
}
export default Input;
