use axum::{routing::get, Router};
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    // 라우터 설정
    let app = Router::new().route("/", get(root));

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
