use async_graphql::{
    EmptyMutation, EmptySubscription, Object, Request as GraphQLRequest,
    Response as GraphQLResponse, Schema,
};

use axum::{
    extract::Extension,
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use std::net::SocketAddr;
use tokio::net::TcpListener;

// 데이터베이스 풀 생성
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok(); // .env 파일에서 환경 변수 로드
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let _ = sqlx::query("SELECT 1").fetch_one(&pool).await?;

    let schema = Schema::build(Query::default(), EmptyMutation, EmptySubscription).finish();

    // 라우터 설정
    let app = Router::new()
        .route("/", get(root))
        .route("/graphql", post(graphql_handler))
        .layer(Extension(schema)); // GraphQL 스키마를 추가

    // 서버 주소 설정
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on {}", addr);

    // 서버 실행
    axum::serve(TcpListener::bind(&addr).await?, app.into_make_service())
        .await
        .unwrap();

    Ok(())
}

async fn root() -> &'static str {
    "Hello, world!"
}

async fn graphql_handler(
    schema: Extension<Schema<Query, EmptyMutation, EmptySubscription>>,
    req: axum::Json<GraphQLRequest>,
) -> axum::Json<GraphQLResponse> {
    axum::Json(schema.execute(req.0).await)
}

// GraphQL 쿼리 정의
#[derive(Default)]
struct Query;
#[Object]
impl Query {
    async fn hello(&self) -> &str {
        "Hello, world!"
    }
}
