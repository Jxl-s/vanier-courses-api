import { useEffect, useState } from "react";
import Button from "../components/interactive/Button";
import Input from "../components/interactive/Input";
import List from "../components/interactive/List";
import Schedule, { dayToInt } from "../components/Schedule";
import MainLayout from "../layouts/main";

interface CourseData {
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
}

interface CourseDisplayProps {
    course: { course: string; section: number };
    data: CourseData[];
    onSectionChange: (section: number) => void;
    onDelete: () => void;
}

function CourseDisplay({ course, data, onSectionChange, onDelete }: CourseDisplayProps) {
    // to make sure that the section is 5 digits
    const addLeadingZeros = (num: number) => {
        return num.toString().padStart(5, "0");
    };

    const sectionOptions = data.map((section, i) => {
        return addLeadingZeros(section.section) + " - " + section.teacher;
    });

    sectionOptions.push("Try All");

    // Get the course's title
    const title = data.find((section) => section.section === course.section)?.title;

    return (
        <div className="grid grid-cols-5 bg-zinc-800 rounded-lg p-3 my-2 gap-2">
            <div className="col-span-2">
                <p>{course.course}</p>
                <p className="opacity-80">{title ?? "No title"}</p>
            </div>
            <div className="col-span-2">
                <List
                    options={sectionOptions}
                    onChange={(selected) => {
                        // split before the first dash
                        const section = selected.split("-")[0].trim();
                        if (section === "Try All") {
                            return onSectionChange(-1);
                        }

                        // otherwise, just remove the leading 0's and parse it as an int
                        return onSectionChange(parseInt(section));
                    }}
                />
            </div>
            <div className="col-span-1">
                <Button
                    variant="solid"
                    color="danger"
                    className="w-full h-9 mt-1"
                    onClick={onDelete}
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

export default function Schedules() {
    const [courseData, setCourseData] = useState<Map<string, CourseData[]>>(new Map());

    const [currentCourses, setCurrentCourses] = useState<
        {
            course: string;
            section: number;
        }[]
    >([]);

    const [inputCourseCode, setInputCourseCode] = useState("");
    const [isFetchingData, setIsFetchingData] = useState(false);

    async function onAddCourse() {
        // Check if the course is already part of the current courses
        if (currentCourses.find((course) => course.course === inputCourseCode)) {
            console.log("course already added");
            return;
        }

        setIsFetchingData(true);

        // Fetch the course data from the API
        const res = await fetch("http://192.168.1.171:8080/api/courses/" + inputCourseCode);
        if (res.status !== 200) {
            console.log("error");
            setIsFetchingData(false);
            return;
        }

        const resJson = await res.json();

        // If the course data is empty, then the course code is invalid
        if (resJson.data.length === 0) {
            console.log("invalid course");
            setIsFetchingData(false);
            return;
        }

        // Add the data to the course data map
        setCourseData((prev) => {
            const map = new Map(prev);
            map.set(
                inputCourseCode.toUpperCase(),
                resJson.data.map((course: any) => ({
                    title: course.title,
                    section: course.section,
                    teacher: course.teacher,
                    periods: course.periods,
                }))
            );

            return map;
        });

        // Add the course to the current courses
        setCurrentCourses((prev) => {
            return [
                ...prev,
                {
                    course: inputCourseCode.toUpperCase(),
                    section: resJson.data[0].section,
                },
            ];
        });

        setIsFetchingData(false);
    }

    function getValidDispositions() {
        const coursesToTry: CourseData[][] = [];

        for (const course of currentCourses) {
            const data = courseData.get(course.course);

            if (course.section !== -1) {
                // insert the current section into the courses to try
                const sectionCourse = data?.filter((section) => section.section === course.section);

                if (sectionCourse) {
                    coursesToTry.push(sectionCourse);
                    continue;
                }
            }

            // Since it's -1, we try all the sections
            coursesToTry.push(data ?? []);
        }

        // Find all the permutations of the courses to try. the total
        // number of permutations is the product of the lengths of each
        // array in coursesToTry
        const cartesianProduct = <T extends any>(arrays: T[][]) => {
            const result: any[][] = [];

            const helper = (arr: any[], i: number) => {
                for (let j = 0; j < arrays[i].length; j++) {
                    const a = arr.slice(0);
                    a.push(arrays[i][j]);
                    if (i === arrays.length - 1) {
                        result.push(a);
                    } else {
                        helper(a, i + 1);
                    }
                }
            };

            helper([], 0);

            return result;
        };

        const permutations = cartesianProduct(coursesToTry) as CourseData[][];

        // Find which permutations are valid

        const timeToInt = (hours: number, minutes: number) => {
            return hours * 60 + minutes;
        };

        const validPermutations = permutations.filter((permutation) => {
            // Check if there are any overlapping periods
            let days: { start: number; end: number }[][] = [];

            for (let i = 0; i < 5; i++) {
                days.push([]);
            }

            let isValid = true;

            for (const course of permutation) {
                for (const period of course.periods) {
                    // Try adding each period of the course to the day
                    const day = dayToInt(period.day);
                    const daySlots = days[day];

                    const startTime = timeToInt(period.start_hour, period.start_minute);
                    const endTime = timeToInt(period.end_hour, period.end_minute);

                    // find if it collides
                    for (const slot of daySlots) {
                        if (startTime < slot.end && endTime > slot.start) {
                            isValid = false;
                            break;
                        }
                    }

                    // if it's valid, we push it in
                    daySlots.push({
                        start: startTime,
                        end: endTime,
                    });
                }
            }

            return isValid;
        });

        return validPermutations;
    }

    const currentCombinations = currentCourses.length > 0 ? getValidDispositions() : [];
    const [combIdx, setCombIdx] = useState(1);

    const nextComb = () => {
        setCombIdx((prev) => Math.min(currentCombinations.length, prev + 1));
    };

    const prevComb = () => {
        setCombIdx((prev) => Math.max(1, prev - 1));
    };

    return (
        <MainLayout>
            <div className="grid grid-cols-2">
                <div className="w-full col-span-2 xl:col-span-1">
                    <div>
                        <p className="text-2xl pb-1 border-zinc-500 border-b mb-2 text-center">
                            Course Selector
                        </p>
                        <div>
                            <p>Add a course</p>
                            <div>
                                <Input
                                    placeholder="Course Code"
                                    height={8}
                                    value={inputCourseCode}
                                    onChange={setInputCourseCode}
                                />
                                <Button
                                    variant="solid"
                                    color="secondary"
                                    className="w-full mt-2"
                                    onClick={onAddCourse}
                                    disabled={isFetchingData}
                                >
                                    {isFetchingData ? "Fetching course..." : "Add Course"}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl pb-1 border-zinc-500 border-b mb-2 text-center">
                            Current Courses
                        </p>
                        <div>
                            {currentCourses.map((course, i) => {
                                const data = courseData.get(course.course);

                                return (
                                    <CourseDisplay
                                        key={i}
                                        course={course}
                                        data={data ?? []}
                                        onSectionChange={(section) => {
                                            const newCourses = [...currentCourses];
                                            newCourses[i].section = section;

                                            setCurrentCourses(newCourses);
                                        }}
                                        onDelete={() => {
                                            setCurrentCourses((prev) => {
                                                return prev.filter((_, j) => j !== i);
                                            });
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <p className="opacity-50">
                            There are currently {currentCombinations.length} possible schedule(s)
                        </p>
                    </div>
                </div>
                <div className="w-full col-span-2 xl:col-span-1 mt-2 xl:mt-0">
                    <p className="text-2xl pb-1 border-zinc-500 border-b mb-2 text-center">
                        Schedule Visualizer
                    </p>
                    <div className="w-10/12 mx-auto">
                        <Schedule data={currentCombinations[combIdx - 1] ?? []} />
                        <div className="mt-2 grid grid-cols-3">
                            <Button
                                variant="solid"
                                color="primary"
                                className="w-full"
                                disabled={combIdx <= 1}
                                onClick={prevComb}
                            >
                                {"Previous"}
                            </Button>
                            <p className="text-center my-auto">
                                Schedule {combIdx} of {currentCombinations.length}
                            </p>
                            <Button
                                variant="solid"
                                color="primary"
                                className="w-full"
                                disabled={combIdx >= currentCombinations.length}
                                onClick={nextComb}
                            >
                                {"Next"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
