interface Props {
    data: {
        title: string;
        section: number;
        teacher: string;
        periods: {
            day: string;
            room: string;

            start_hour: number;
            start_minute: number;

            end_hour: number;
            end_minute: number;
        }[];
    }[];
}

export const dayToInt = (day: string) => {
    switch (day) {
        case "Monday":
            return 0;
        case "Tuesday":
            return 1;
        case "Wednesday":
            return 2;
        case "Thursday":
            return 3;
        case "Friday":
            return 4;
        default:
            return -1;
    }
};

const calculateScheduleCells = (data: Props["data"]) => {
    // first, flatten the courses
    const flatenedCourses = data.flatMap((course) => {
        return course.periods.map((period) => ({
            ...course,
            periods: undefined,
            period,
        }));
    });

    // initialize the cells for each time slot
    const scheduleTable: (
        | {
              periods: undefined;
              period: {
                  day: string;
                  room: string;
                  start_hour: number;
                  start_minute: number;
                  end_hour: number;
                  end_minute: number;
              };
              title: string;
              section: number;
              teacher: string;
          }
        | 0
        | 1
    )[][] = [];

    for (let i = 0; i < 20; i++) {
        scheduleTable.push([]);
    }

    for (const period of flatenedCourses) {
        const classStart = period.period.start_hour + period.period.start_minute / 60;
        const classEnd = period.period.end_hour + period.period.end_minute / 60;

        const rowIndex = classStart * 2 - 16;
        const targetRow = scheduleTable[rowIndex];

        targetRow[dayToInt(period.period.day)] = period;

        // find the following cells that will be taken
        const classDuration = classEnd - classStart;
        const cellsToTake = classDuration * 2;

        // fill the cells which this class takes
        for (let i = 1; i < cellsToTake; i++) {
            scheduleTable[rowIndex + i][dayToInt(period.period.day)] = 1;
        }
    }

    // fill the rest of the cells with 0, meaning its empty
    for (let i = 0; i < 20; i++) {
        const row = scheduleTable[i];

        for (let j = 0; j < 5; j++) {
            if (row[j] === undefined) {
                row[j] = 0;
            }
        }
    }

    return scheduleTable;
};

export default function Schedule({ data }: Props) {
    const numToTimeString = (num: number) => {
        const hours = Math.floor(num);
        const minutes = (num - hours) * 60;

        return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    };

    const scheduleTable = calculateScheduleCells(data);
    return (
        <table border={0} cellPadding={0} className="w-full bg-zinc-800">
            <tbody>
                {/* The table's header */}
                <tr className="border border-zinc-600">
                    <td className="text-center"></td>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, i) => (
                        <td
                            className="text-center col-span-2 border-l border-zinc-600 text-sm"
                            width={"20%"}
                            key={i}
                        >
                            {day}
                        </td>
                    ))}
                </tr>
                {/* The body of the table */}
                {new Array(20).fill(0).map((_, i) => {
                    const startTime = 8 + i * 0.5;
                    const endTime = startTime + 0.5;

                    const startString = numToTimeString(startTime);
                    const endString = numToTimeString(endTime);

                    return (
                        <tr key={i} className="border-l border-zinc-600">
                            <td
                                align="center"
                                className="text-xs border-b border-r border-zinc-600 p-1"
                            >
                                {startString}
                                <br />
                                {endString}
                            </td>
                            {scheduleTable[i].map((row, j) => {
                                if (row == 1) {
                                    // do nothing
                                } else if (row == 0) {
                                    // empty cell
                                    return (
                                        <td
                                            key={j}
                                            align="center"
                                            className="border-b border-r border-zinc-600"
                                        />
                                    );
                                } else {
                                    // add the course
                                    const start =
                                        row.period.start_hour + row.period.start_minute / 60;

                                    const end = row.period.end_hour + row.period.end_minute / 60;

                                    return (
                                        <td
                                            key={j}
                                            rowSpan={(end - start) * 2}
                                            align="center"
                                            className="border-b border-r border-zinc-600 text-xs"
                                        >
                                            <span>
                                                <b>{row.title.slice(0, 20)}</b>
                                                <br />
                                                sec. {row.section.toString().padStart(5, "0")}
                                                <br />
                                                {row.teacher}
                                                <br />
                                                {row.period.room}
                                            </span>
                                        </td>
                                    );
                                }
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
