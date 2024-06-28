use std::io::Cursor;

use process_mining::{
    alphappp::full::{alphappp_discover_petri_net_with_timing_fn, AlphaPPPConfig},
    event_log::{
        activity_projection::EventLogActivityProjection,
        constants::ACTIVITY_NAME,
        import_xes::{build_ignore_attributes, XESImportOptions},
        stream_xes::{stream_xes_slice, stream_xes_slice_gz},
    },
    export_petri_net_to_pnml,
    petri_net::{
        image_export::{export_petri_net_to_dot_graph, graph_to_dot},
        import_pnml::import_pnml_reader,
    },
};
use wasm_bindgen::prelude::*;
// pub use wasm_bindgen_rayon::init_thread_pool;
extern crate console_error_panic_hook;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}


#[wasm_bindgen]
pub fn wasm_discover_alphappp_petri_net_from_xes_vec(
    xes_data: &[u8],
    is_compressed_gz: bool,
) -> Result<String,String> {
    console_error_panic_hook::set_once();
    console_log!("Got data: {}", xes_data.len());
    let options = XESImportOptions {
        ignore_event_attributes_except: Some(build_ignore_attributes(vec![ACTIVITY_NAME])),
        ignore_trace_attributes_except: Some(build_ignore_attributes(Vec::<&str>::new())),
        ignore_log_attributes_except: Some(build_ignore_attributes(Vec::<&str>::new())),
        ..XESImportOptions::default()
    };
    let (mut stream, _log_data) = if is_compressed_gz {
        stream_xes_slice_gz(xes_data, options)
    } else {
        stream_xes_slice(xes_data, options)
    }
    .unwrap();
    // let now = Instant::now();

    web_sys::console::time_with_label("xes-import");
    let log_proj: EventLogActivityProjection = (&mut stream).into();
    console_log!("Got Log Activity Projection: {}", log_proj.traces.len());
    let (pn, _) = alphappp_discover_petri_net_with_timing_fn(
        &log_proj,
        AlphaPPPConfig {
            balance_thresh: 0.1,
            fitness_thresh: 0.8,
            replay_thresh: 0.3,
            log_repair_skip_df_thresh_rel: 4.0,
            log_repair_loop_df_thresh_rel: 4.0,
            absolute_df_clean_thresh: 5,
            relative_df_clean_thresh: 0.05,
        },
        &|| 0,
    );
    Ok(serde_json::to_string(&pn).unwrap())
}



#[wasm_bindgen]
pub fn wasm_petri_net_dot(pn_json: &str) -> Result<String, String> {
    match serde_json::from_str(pn_json) {
        Ok(pn) => {
            console_log!("Imported Petri Net JSON");
            let g = export_petri_net_to_dot_graph(&pn, None);
            Ok(graph_to_dot(&g))
        }
        Err(e) => {
            console_log!("Failed to parse Petri Net {:?}", e);
            Err(format!("Failed to Parse Petri Net JSON: {:?}", e))
        }
    }
}

#[wasm_bindgen]
pub fn wasm_import_pnml(pnml: &str) -> Result<String, String> {
    let mut cursor = Cursor::new(pnml);
    match import_pnml_reader(&mut cursor) {
        Ok(pn) => serde_json::to_string(&pn)
            .map_err(|e| format!("Failed to serialize Petri Net to pn_json {:?}", e)),
        Err(e) => {
            console_log!("Failed to parse Petri Net {:?}", e);
            Err(format!("Failed to import PNML {:?}", e))
        }
    }
}

#[wasm_bindgen]
pub fn wasm_export_pnml(pn_json: &str) -> Result<String, String> {
    match serde_json::from_str(pn_json) {
        Ok(pn) => {
            console_log!("Imported Petri Net JSON");
            let mut buf = Vec::new();
            export_petri_net_to_pnml(&pn, &mut buf)
                .map_err(|e| format!("Failed to export PNML {:?}", e))?;
            let pnml = String::from_utf8(buf)
                .map_err(|e| format!("Failed to construct UTF-8 String from PNML {:?}", e))?;
            Ok(pnml)
        }
        Err(e) => {
            console_log!("Failed to parse Petri Net {:?}", e);
            Err(format!("Failed to Parse Petri Net JSON: {:?}", e))
        }
    }
}
