use std::collections::HashMap;

use process_mining::event_log::import_xes::build_ignore_attributes;
use process_mining::event_log::XESEditableAttribute;
use process_mining::{stream_xes_from_path, XESImportOptions};
use pyo3::prelude::*;

#[pyfunction]
fn get_num_events_per_hour(
    xes_path: String,
) -> PyResult<HashMap<String, usize>> {
    let mut map = HashMap::new();

    let (mut log_stream, log_data) =
        stream_xes_from_path(&xes_path, XESImportOptions::default()).unwrap();
    let classifier = log_data
        .classifiers
        .iter()
        .find(|c| c.name == "Event Name")
        .unwrap();
    let mut event_attrs_to_import = classifier.keys.clone();
    event_attrs_to_import.extend(vec!["time:timestamp".to_string()]);
    log_stream.set_options(XESImportOptions {
        ignore_event_attributes_except: Some(build_ignore_attributes(&event_attrs_to_import)),
        ignore_trace_attributes_except: Some(build_ignore_attributes(Vec::<&str>::new())),
        sort_events_with_timestamp_key: Some("time:timestamp".to_string()),
        ..XESImportOptions::default()
    });
    log_stream.for_each(|t| {
        for e in &t.events {
            if let Some(date) = e.attributes.get_by_key("time:timestamp").and_then(|a| a.value.try_as_date()) {
                let ds = date.time().format("%H").to_string();
                *map.entry(ds).or_default() += 1;
            }
        }
    });
    Ok(map)
}

/// A Python module implemented in Rust.
#[pymodule]
fn event_hours_analyzer(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_num_events_per_hour, m)?)?;
    Ok(())
}
