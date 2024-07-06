use std::{
  fs::{self, File},
  io::BufReader,
};

use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

use process_mining::event_log::ocel::ocel_struct::OCEL;

use crate::{linked_ocel::{IndexLinkedOCEL, OCELInfo}, AppState};

#[derive(Deserialize, Serialize)]
pub struct LoadOcel {
  name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OCELFilePath {
  name: &'static str,
  path: &'static str,
}

pub const DATA_PATH: &str = "./data/";

pub async fn get_available_ocels() -> (StatusCode, Json<Option<Vec<String>>>) {
  let mut ocel_names: Vec<String> = Vec::new();
  if let Ok(paths) = fs::read_dir(DATA_PATH) {
      for dir_entry in paths.flatten() {
          let path_buf = dir_entry.path();
          let path = path_buf.as_os_str().to_str().unwrap();
          if path.ends_with(".json") || path.ends_with(".xml") {
              ocel_names.push(path.split('/').last().unwrap().to_string())
          }
      }
  }
  (StatusCode::OK, Json(Some(ocel_names)))
}

pub async fn load_ocel_file_req(
  State(state): State<AppState>,
  Json(payload): Json<LoadOcel>,
) -> (StatusCode, Json<Option<OCELInfo>>) {
  match load_ocel_file_to_state(&payload.name, &state) {
      Some(ocel_info) => (StatusCode::OK, Json(Some(ocel_info))),
      None => (StatusCode::BAD_REQUEST, Json(None)),
  }
}

pub fn load_ocel_file_to_state(name: &str, state: &AppState) -> Option<OCELInfo> {
  match load_ocel_file(name) {
      Ok(ocel) => {
          let ocel_info: OCELInfo = (&ocel).into();
          let mut x = state.ocel.write().unwrap();
          *x = Some(IndexLinkedOCEL::new(ocel));
          Some(ocel_info)
      }
      Err(e) => {
          eprintln!("Error importing OCEL: {:?}", e);
          None
      }
  }
}

pub fn load_ocel_file(name: &str) -> Result<OCEL, std::io::Error> {
  let file = File::open(format!("{DATA_PATH}{name}"))?;
  let reader = BufReader::new(file);
  let ocel: OCEL = serde_json::from_reader(reader)?;
  Ok(ocel)
}
