use vanier_courses_api::get_courses;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let courses = get_courses(420).await?;
    println!("{:#?}", courses);
    Ok(())
}
