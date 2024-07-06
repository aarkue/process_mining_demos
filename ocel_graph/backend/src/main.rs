use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, State},
    http::{header::CONTENT_TYPE, Method, StatusCode},
    routing::{get, post},
    Json, Router,
};
use itertools::Itertools;
use linked_ocel::{IndexLinkedOCEL, OCELInfo};
use ocel_graph::{get_ocel_graph, OCELGraph, OCELGraphOptions};

use std::{
    env,
    sync::{Arc, RwLock},
};

use process_mining::{event_log::ocel::ocel_struct::OCEL, import_ocel_xml_slice};
use tower_http::cors::CorsLayer;

use crate::load_ocel::{get_available_ocels, load_ocel_file_req};
pub mod linked_ocel;
pub mod load_ocel;
pub mod ocel_graph;

#[derive(Clone)]
pub struct AppState {
    ocel: Arc<RwLock<Option<IndexLinkedOCEL>>>,
}

#[tokio::main]
async fn main() {
    let args = env::args().collect_vec();
    dbg!(args);
    let state = AppState {
        ocel: Arc::new(RwLock::new(None)),
    };
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([CONTENT_TYPE])
        .allow_origin(tower_http::cors::Any);

    // build our application with a single route
    let app = Router::new()
        .route("/ocel/load", post(load_ocel_file_req))
        .route("/ocel/info", get(get_loaded_ocel_info))
        .route(
            "/ocel/upload-json",
            post(upload_ocel_json).layer(DefaultBodyLimit::disable()),
        )
        .route(
            "/ocel/upload-xml",
            post(upload_ocel_xml).layer(DefaultBodyLimit::disable()),
        )
        .route("/ocel/available", get(get_available_ocels))
        .route("/ocel/graph", post(ocel_graph_req))
        .with_state(state)
        .route(
            "/",
            get(|| async {
                "Welcome to the ocel_graph backend!\nHead over to the frontend to use this tool."
            }),
        )
        .layer(cors);
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

pub async fn get_loaded_ocel_info(
    State(state): State<AppState>,
) -> (StatusCode, Json<Option<OCELInfo>>) {
    match with_ocel_from_state(&State(state), |ocel| (&ocel.ocel).into()) {
        Some(ocel_info) => (StatusCode::OK, Json(Some(ocel_info))),
        None => (StatusCode::NOT_FOUND, Json(None)),
    }
}

async fn upload_ocel_xml<'a>(
    State(state): State<AppState>,
    ocel_bytes: Bytes,
) -> (StatusCode, Json<OCELInfo>) {
    let ocel = import_ocel_xml_slice(&ocel_bytes);
    let mut x = state.ocel.write().unwrap();
    let ocel_info: OCELInfo = (&ocel).into();
    *x = Some(IndexLinkedOCEL::new(ocel));

    (StatusCode::OK, Json(ocel_info))
}

async fn upload_ocel_json<'a>(
    State(state): State<AppState>,
    ocel_bytes: Bytes,
) -> (StatusCode, Json<OCELInfo>) {
    let ocel: OCEL = serde_json::from_slice(&ocel_bytes).unwrap();
    let mut x = state.ocel.write().unwrap();
    let ocel_info: OCELInfo = (&ocel).into();
    *x = Some(IndexLinkedOCEL::new(ocel));
    (StatusCode::OK, Json(ocel_info))
}

pub fn with_ocel_from_state<T, F>(State(state): &State<AppState>, f: F) -> Option<T>
where
    F: FnOnce(&IndexLinkedOCEL) -> T,
{
    let read_guard = state.ocel.read().ok()?;
    let ocel_ref = read_guard.as_ref()?;
    Some(f(ocel_ref))
}

pub async fn ocel_graph_req<'a>(
    State(state): State<AppState>,
    Json(options): Json<OCELGraphOptions>,
) -> (StatusCode, Json<Option<OCELGraph>>) {
    let graph = with_ocel_from_state(&State(state), |ocel| get_ocel_graph(ocel, options));
    match graph.flatten() {
        Some(x) => (StatusCode::OK, Json(Some(x))),
        None => (StatusCode::BAD_REQUEST, Json(None)),
    }
}
