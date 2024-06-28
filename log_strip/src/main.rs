use std::{collections::HashSet, fs::File, path::PathBuf, time::Duration};

use chrono::prelude::*;
use clap::Parser;
use indicatif::ProgressBar;
use process_mining::{
    event_log::{import_xes::XESParseError, AttributeValue, XESEditableAttribute},
    export_xes_trace_stream_to_file, XESImportOptions,
};

#[derive(Parser, Debug)]
#[command(
    version,
    about = "A CLI to transform XES event logs using trace streams."
)]
struct Args {
    #[clap(required_unless_present("input"))]
    input_pos: Option<PathBuf>,
    #[clap(short, long, required_unless_present("input_pos"))]
    input: Option<PathBuf>,

    #[clap(required_unless_present("output"))]
    output_pos: Option<PathBuf>,
    #[clap(short, long, required_unless_present("output_pos"))]
    output: Option<PathBuf>,
}

fn main() -> Result<(), XESParseError> {
    let args = Args::parse();
    let input = args.input.or(args.input_pos).unwrap();
    let output = args.output.or(args.output_pos).unwrap();
    println!("Importing from {:?} and exporting to {:?}\n", input, output);

    // XES Import Options: Only process concept:name of traces/events + timestamp of events
    let options = XESImportOptions {
        ignore_log_attributes_except: Some(HashSet::default()),
        ignore_trace_attributes_except: 
        Some(
            vec!["concept:name".to_string()].into_iter().collect(),
        ),
        ignore_event_attributes_except: Some(
            vec!["concept:name".to_string(), "time:timestamp".to_string()]
                .into_iter()
                .collect(),
        ),
        ..XESImportOptions::default()
    };
    // Open file and initialize streaming XES parser
    let file = File::open(&input).expect("Input file not found");
    let is_gz = input.extension().is_some_and(|ext| ext == "gz");
    let stream_res = if is_gz {
        process_mining::stream_xes_file_gz(file, options)
    } else {
        process_mining::stream_xes_file(file, options)
    };
    // Initialize progress spinner
    let progress = ProgressBar::new_spinner();
    progress.set_style(
        indicatif::ProgressStyle::with_template("{spinner} {msg} [Elapsed: {elapsed_precise}]")
            .unwrap(),
    );
    progress.set_message(format!(
        "Progressing {}...",
        input.file_name().unwrap_or_default().to_string_lossy()
    ));

    // Check if streaming parser encountered error
    match stream_res {
        Ok((mut trace_stream, log_data)) => {
            // if not, we can initialize the streaming XES exporter
            let output_file = File::create(&output)?;
            // ...and progress the progress spinner
            progress.enable_steady_tick(Duration::from_millis(50));
            // Create transformed trace stream, where timestamp seconds and nanoseconds are set to 0
            let transformed_stream = trace_stream.into_iter().map(|mut t| {
                t.events.iter_mut().for_each(|e| {
                    if let Some(t) = e.attributes.get_by_key_mut("time:timestamp") {
                        if let AttributeValue::Date(d) = t.value {
                            t.value = AttributeValue::Date(
                                d.with_second(0).unwrap().with_nanosecond(0).unwrap(),
                            );
                        }
                    }
                });
                // Return transformed trace
                t
            });
            // Start streaming XES export with transformed trace stream
            export_xes_trace_stream_to_file(
                transformed_stream,
                log_data,
                output_file,
                output.extension().is_some_and(|ext| ext == "gz"),
            )
            .inspect_err(|e| eprintln!("XES Export Failed: {e}"))?;
            // Finish spinner
            progress.finish();
            // Done :)
            println!("\n\nStreaming export finished in {:?}", progress.elapsed());
            Ok(())
        }
        Err(err) => {
            eprintln!("Failed to import XES: {}", err);
            Err(err)
        }
    }
}
