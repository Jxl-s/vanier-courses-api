use actix_cors::Cors;
use actix_web::{
    body::BoxBody, get, web::Path, App, HttpResponse, HttpServer, Responder, ResponseError,
};
use derive_more::{Display, Error};
use reqwest::StatusCode;
use serde::Serialize;
use vanier_courses_api::{get_courses, get_departments, Course};

#[derive(Debug, Serialize)]
pub struct OkResponse<T> {
    pub code: u16,
    pub data: T,
}

#[derive(Debug, Serialize, Display, Error)]
#[display(fmt = "{}", message)]
pub struct ErrResponse {
    pub code: u16,
    pub message: String,
}

// Implementations
impl ResponseError for ErrResponse {
    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::build(self.status_code()).json(self)
    }

    fn status_code(&self) -> StatusCode {
        StatusCode::from_u16(self.code).unwrap()
    }
}

impl<T: Serialize> Responder for OkResponse<T> {
    fn respond_to(self, _: &actix_web::HttpRequest) -> HttpResponse<Self::Body> {
        HttpResponse::build(StatusCode::from_u16(self.code).unwrap()).json(self)
    }

    type Body = BoxBody;
}

pub type Res<T> = Result<OkResponse<T>, ErrResponse>;

#[get("api/departments")]
async fn api_get_departments() -> Res<Vec<u16>> {
    let depts = get_departments().await.map_err(|_| ErrResponse {
        code: 500,
        message: "Failed to get departments".to_string(),
    })?;

    Ok(OkResponse {
        code: 200,
        data: depts,
    })
}

#[get("api/departments/{dept_id}")]
async fn api_get_department_courses(dept_id: Path<u16>) -> Res<Vec<Course>> {
    let dept_id = dept_id.into_inner();
    let courses = get_courses(dept_id).await.map_err(|_| ErrResponse {
        code: 500,
        message: "Failed to get courses".to_string(),
    })?;

    Ok(OkResponse {
        code: 200,
        data: courses,
    })
}

#[get("api/courses/{course_code}")]
async fn api_get_courses(course_code: Path<String>) -> Res<Vec<Course>> {
    let course_code = course_code.into_inner();

    let dept_id: u16 = course_code
        .split("-")
        .next()
        .ok_or(ErrResponse {
            code: 400,
            message: "Invalid course code".to_string(),
        })?
        .trim()
        .parse()
        .map_err(|_| ErrResponse {
            code: 400,
            message: "Invalid course code".to_string(),
        })?;

    let dept_courses = get_courses(dept_id).await.map_err(|_| ErrResponse {
        code: 500,
        message: "Failed to get courses".to_string(),
    })?;

    let same_courses: Vec<Course> = dept_courses
        .iter()
        .filter(|&c| c.course.to_uppercase() == course_code.to_uppercase())
        .map(|c| c.clone())
        .collect();

    Ok(OkResponse {
        code: 200,
        data: same_courses,
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    HttpServer::new(|| {
        App::new()
            .wrap(Cors::default().allowed_origin("http://192.168.1.171:5173"))
            .service(api_get_departments)
            .service(api_get_department_courses)
            .service(api_get_courses)
            .service(
                actix_files::Files::new("/", "./frontend/dist")
                    .show_files_listing()
                    .index_file("index.html"),
            )
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await?;

    Ok(())
}
