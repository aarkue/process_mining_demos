# Rust4PM Demos

## Video


https://github.com/aarkue/rust4pm_demos/assets/20766652/141017ed-7c93-46ff-a234-befbb04309ab






## Overview
This repository contains the following software projects, which are all based on the Rust crate `process_mining` (See https://crates.io/crates/process_mining and https://github.com/aarkue/rust4pm/).

- `log_strip`: CLI for Stripping XES Attributes
- `event_hours_analyzer`: Python Script for Data Visualization
- `ocel_graph`: Web Service for Constructing Graphs from OCED
- `petri_net_wasm`: Petri Net Editor with PNML Support via WASM

See below for instructions on how to run or use each projects.
For some of the projects, pre-built versions are available for convenience.

To build any of these projects yourself, you need to have Rust (see https://www.rust-lang.org/tools/install) installed.
To build the frontends of `ocel_graph` and `petri_net_wasm` you will additionally need to have [Node.js](https://nodejs.org/en/download/) installed.

For convenience, binary builds for Linux and Windows are available for the `log_strip` CLI and the backend of `ocel_graph` at https://github.com/aarkue/rust4pm_demos/releases/latest.
Simply download the corresponding file (e.g., `log_strip-linux.zip`) extract it and run the contained binary.
Additionally, the frontends for `petri_net_wasm` and `ocel_graph` are available online (see https://aarkue.github.io/rust4pm_demos/).
While the `petri_net_wasm` is self-contained, the `ocel_graph` expects a backend running locally on your machine that provides the backend API at `localhost:3000`.

For building any of the demo applications, first navigate to the corresponding folder.

## `log_strip`
![log_stripper](https://github.com/aarkue/rust4pm_demos/assets/20766652/a0c7cca1-4b1e-4b3c-9aae-5a23a57be24e)
### Provided Binary
1. Download the corresponding `log_strip-XZY.zip`file from https://github.com/aarkue/rust4pm_demos/releases/latest and extract it.
2. The resulting file can be ran like this: `log_strip -i <input-file> -o <output-file>` (or  `log_strip.exe -i <input-file> -o <output-file>` on Windows)
### Manual Build
1. `cargo run --release -- -i <input-file> -o <output-file>`

## `event_hours_analyzer`
![hour_plotter](https://github.com/aarkue/rust4pm_demos/assets/20766652/2e1302a6-4a92-4da6-8b48-9f99d0176303)

### Manual Build
1. Create and activate a virtual Python environment (e.g., `python -m venv venv` and `source ./venv/bin/activate`)
2. Install [maturin](https://www.maturin.rs/) `pip install maturin`
3. `maturin develop --release`
4. Execute the Jupyter notebook `event_hours_analyzer.ipynb` using the same Python environment

## `ocel_graph`
![ocel_graph](https://github.com/aarkue/rust4pm_demos/assets/20766652/426d9dc9-0a2b-487e-b49b-b349c68fc348)
### Provided Binary + Frontend
1. Download the corresponding `ocel_graph_backend-XZY.zip` file from https://github.com/aarkue/rust4pm_demos/releases/latest and extract it.
2. Run the resulting `ocel_graph_backend[.exe]` file in a console
3. Head over to https://aarkue.github.io/rust4pm_demos/ocel_graph/ and select an OCEL2.0 XML/JSON file (see for example files)
4. After an OCEL2.0 was loaded, choose the wanted options on the right and click _Apply_ to view the resulting graph
### Manual Build
1. Start the backend (`cd backend` and `cargo run --release`)
2. Start the frontend (`cd frontend`, `npm i`, and run `npm run dev`)
3. Open the specified URL in the browser

## `petri_net_wasm`
![petri_net_wasm](https://github.com/aarkue/rust4pm_demos/assets/20766652/4932884d-4255-4f27-841e-5eec3ebf5931)

### Provided Frontend
1. Head over to https://aarkue.github.io/rust4pm_demos/petri_net_wasm/ and use it :)

See https://www.processmining.org/event-data.html for some example XES files to use for discovery. Notice, that as the tool runs completely in the browser very large XES file with many activities might not work well.
### Manual Build
1. Build the WASM library (`wasm-pack build --target web --release`)
2. Run the frontend (`npm i` and `npm run dev`)
3. Open the specified URL in the browser
