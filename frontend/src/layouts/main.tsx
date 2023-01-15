interface Props {
    children: React.ReactNode;
    className?: string;
}

export default function MainLayout({ children, className }: Props) {
    return <div className={`p-4 ${className}`}>{children}</div>;
}
