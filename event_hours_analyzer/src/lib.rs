use std::collections::{HashMap, HashSet};

use process_mining::event_log::import_xes::build_ignore_attributes;
use process_mining::event_log::XESEditableAttribute;
use process_mining::{import_xes_file, XESImportOptions};
use pyo3::prelude::*;

#[pyfunction]
fn get_num_events_per_hour(xes_path: String) -> PyResult<HashMap<String, usize>> {
    let log = import_xes_file(
        &xes_path,
        XESImportOptions {
            ignore_log_attributes_except: Some(HashSet::default()),
            ignore_trace_attributes_except: Some(HashSet::default()),
            ignore_event_attributes_except: Some(build_ignore_attributes(vec!["time:timestamp"])),
            ..XESImportOptions::default()
        },
    )
    .unwrap();
    let mut map = HashMap::new();
    for t in &log.traces {
        for e in &t.events {
            if let Some(date) = e
                .attributes
                .get_by_key("time:timestamp")
                .and_then(|a| a.value.try_as_date())
            {
                let ds = date.time().format("%H").to_string();
                *map.entry(ds).or_default() += 1;
            }
        }
    }
    Ok(map)
}

/// A Python module implemented in Rust.
#[pymodule]
fn event_hours_analyzer(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_num_events_per_hour, m)?)?;
    Ok(())
}
