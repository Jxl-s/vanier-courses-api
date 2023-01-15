use js_sandbox::Script;
use regex::Regex;
use scraper::ElementRef;

pub const USER_AGENT: &str = "Mozilla/5.0 Chrome/96.0.4664.45 Safari/537.36";
pub const VANIER_URL: &str = "http://vaniercollege.qc.ca/online-schedule/";

/// Function to get the Sucuri token from a website
pub async fn get_sucuri_token() -> Result<String, Box<dyn std::error::Error>> {
    let script_regex = Regex::new(r"<script>([\s\S]*?)</script>").unwrap();

    let website_res = reqwest::Client::new()
        .get(VANIER_URL)
        .header("User-Agent", USER_AGENT)
        .send()
        .await?;

    let website_text = website_res.text().await?;
    let mut website_script = script_regex
        .captures(&website_text)
        .unwrap()
        .get(1)
        .ok_or("No script tag found")?
        .as_str()
        .to_string();

    // De-obfuscate the website script
    website_script = website_script.replace("e(r);", ";return r}");
    website_script = "function get_token() {".to_string() + &website_script;

    let mut script_1 = Script::from_string(&website_script).unwrap();
    let mut deobfuscated: String = script_1.call("get_token", &[""]).unwrap();

    // Get the document cookie from the de-obfuscated script
    deobfuscated = deobfuscated.replace("document.cookie", "var cookie");
    deobfuscated = deobfuscated.replace("location.reload();", "");

    deobfuscated = "function get_cookie() {".to_string() + &deobfuscated;
    deobfuscated += ";return cookie}";

    let mut script_2 = Script::from_string(&deobfuscated).unwrap();
    let cookie: String = script_2.call("get_cookie", &[""]).unwrap();

    Ok(cookie)
}

#[derive(Debug)]
pub enum DayOfWeek {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,

    None,
}

#[derive(Debug)]
pub struct Period {
    pub day: DayOfWeek,
    pub room: String,

    pub start_hour: u8,
    pub start_minute: u8,

    pub end_hour: u8,
    pub end_minute: u8,
}

#[derive(Debug)]
pub struct Course {
    // Course information
    pub section: u16,
    pub course: String,
    pub title: String,

    // Teacher information
    pub teacher: String,
    pub periods: Vec<Period>,
}

/// Fetch the courses of a certain course department
pub async fn get_courses(department: u16) -> Result<Vec<Course>, Box<dyn std::error::Error>> {
    let dept_url = VANIER_URL.to_string() + "_msched_claraf2.asp?dv=" + &department.to_string();
    let sucuri_token = get_sucuri_token().await?;

    let website_res = reqwest::Client::new()
        .get(dept_url)
        .header("User-Agent", USER_AGENT)
        .header("Cookie", sucuri_token)
        .send()
        .await?;

    // Perform web scraping
    let website_text = website_res.text().await?;
    let document = scraper::Html::parse_document(&website_text);

    // select all the <tr> that contain exactly 11 children
    let tr_selector = scraper::Selector::parse("tr").unwrap();
    let td_selector = scraper::Selector::parse("td").unwrap();
    let font_selector = scraper::Selector::parse("font").unwrap();

    let tr_list = document
        .select(&tr_selector)
        .filter(|f| f.children().count() == 21)
        .skip(1);

    // For each table element, get the course element
    let courses = tr_list.map(|f| {
        // Get the first children's inner html, which will become the course ID
        let columns = f.select(&td_selector).collect::<Vec<ElementRef>>();

        // 1. The section, remove trailing 0's and convert to u16
        let section: String = columns.get(0).unwrap().text().collect();
        let section: u16 = section
            .trim_end_matches('0')
            .parse()
            .expect("Failed to parse section");

        // 2. The course, and trim it
        let course: String = columns.get(1).unwrap().text().collect();
        let course = course.trim();

        // 3. The course title, trim it too
        let title: String = columns.get(2).unwrap().text().collect();
        let title = title.trim();

        // 4. The teacher, IN CASE OF MULTIPLE TEACHERS, WE GET THE FIRST ONE
        let teacher: String = columns.get(6).unwrap().text().collect();
        let teacher = teacher.split('\n').next().unwrap().trim();

        // 5. The periods, this will be more tricky
        {
            let get_nth_inner = |n: usize| {
                columns
                    .get(n)
                    .unwrap()
                    .select(&font_selector)
                    .collect::<Vec<ElementRef>>()
                    .first()
                    .unwrap()
                    .inner_html()
            };

            // 5.1: Get the days
            let days = get_nth_inner(7);
            let times = get_nth_inner(8);
            let rooms = get_nth_inner(9);

            let days = days.split("<br>").map(|f| match f.trim() {
                "Mon" => DayOfWeek::Monday,
                "Tue" => DayOfWeek::Tuesday,
                "Wed" => DayOfWeek::Wednesday,
                "Thu" => DayOfWeek::Thursday,
                "Fri" => DayOfWeek::Friday,
                _ => DayOfWeek::None,
            });

            // 5.2: Get the time slots
            let periods = times.split("<br>").zip(days).zip(rooms.split("<br>")).map(
                |((time_string, day), room)| {
                    let room = room.trim();
                    let time_string = time_string.trim();

                    // Get the start and end times
                    let mut time_split = time_string.split('-').map(|t| t.trim());

                    let time_start = time_split.next().unwrap();
                    let time_end = time_split.next().unwrap();

                    // Get the start and end hours, and minutes
                    let mut time_start_split = time_start.split(':').map(|t| t.trim());
                    let mut time_end_split = time_end.split(':').map(|t| t.trim());

                    let start_hour: u8 = time_start_split.next().unwrap().parse().unwrap();
                    let start_minute: u8 = time_start_split.next().unwrap().parse().unwrap();

                    let end_hour: u8 = time_end_split.next().unwrap().parse().unwrap();
                    let end_minute: u8 = time_end_split.next().unwrap().parse().unwrap();

                    Period {
                        day,
                        room: room.to_string(),
                        start_hour,
                        start_minute,
                        end_hour,
                        end_minute,
                    }
                },
            );

            let periods: Vec<Period> = periods.collect();
            Course {
                periods,
                section,

                teacher: teacher.to_string(),
                course: course.to_string(),
                title: title.to_string(),
            }
        }
    });

    Ok(courses.collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    pub async fn can_fetch_sucuri_token() {
        let token = get_sucuri_token()
            .await
            .expect("Failed to fetch Sucuri token");

        assert!(token.starts_with("sucuri_cloudproxy_uuid_"));
    }
}
