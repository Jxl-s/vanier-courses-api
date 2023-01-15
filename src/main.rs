use actix_web::{App, HttpServer};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    HttpServer::new(|| App::new())
        .bind(("0.0.0.0", 8080))?
        .run()
        .await?;

    Ok(())
}
