use js_sandbox::Script;
use regex::Regex;

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

/// Fetch the courses of a certain course department
pub async fn get_courses(department: u16) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let dept_url = VANIER_URL.to_string() + "_msched_claraf2.asp?dv=" + &department.to_string();
    let sucuri_token = get_sucuri_token().await?;

    let website_res = reqwest::Client::new()
        .get(dept_url)
        .header("User-Agent", USER_AGENT)
        .header("Cookie", sucuri_token)
        .send()
        .await?;

    let website_text = website_res.text().await?;
    todo!("Do some web scraping");
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
