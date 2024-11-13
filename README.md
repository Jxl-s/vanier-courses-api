# Vanier Real-Time Schedule API
The backend is written using Rust, while the frontend is developed in React. This project
does not work anymore due to the master schedule being removed, therefore it now uses pre-fetched course
data from the courses list.

# Features
- Real-time course data retrieval (bypasses anti-web-scraping measures).
- Similar user interface to Omnivox' course registration.
- Saving schedules.
- "Try-all" option for any course combination.

# Disclaimer
I re-coded the project in Next.JS and developed new web scraping workflows to dump courses, rather than fetching real-time data
since Vanier College has made it difficult to retrieve them. That version can be found [here](https://github.com/Jxl-s/vanier-schedule-maker-2).

Instead of courses being located in a single page, it has been spread over 70+ pages,
therefore required some more advanced web scraping techniques that are much slower than before.

Demo of the new website can be found here: https://vanier-schedule-maker-2.vercel.app/
