interface Props {
    children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
    return <div className="p-4">{children}</div>;
}
