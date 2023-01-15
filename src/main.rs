use vanier_courses_api::{get_courses, get_departments};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let courses = get_departments().await?;
    println!("{:#?}", courses);
    Ok(())
}
