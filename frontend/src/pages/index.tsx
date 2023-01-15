import MainLayout from "../layouts/main";

interface ScheduleButtonProps {
    name: string;
}

function ScheduleButton({ name }: ScheduleButtonProps) {
    return (
        <button className="border-blue-600 bg-blue-600 hover:bg-blue-600/70 rounded-lg py-1 px-4 duration-300">
            {name}
        </button>
    );
}

export default function Index() {
    return (
        <MainLayout>
            <p className="text-2xl pb-1 border-zinc-500 border-b mb-4">
                Select the schedule to edit
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                <ScheduleButton name="Fall 2022" />
                <button className="border-blue-400 bg-blue-400 hover:bg-blue-400/70 rounded-lg py-1 px-4 duration-300">
                    Create New
                </button>
            </div>
        </MainLayout>
    );
}
