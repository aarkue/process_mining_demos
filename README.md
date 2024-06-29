# process_mining Demos

This repository contains the following software projects, which are all based on the Rust crate `process_mining` (See https://crates.io/crates/process_mining and https://github.com/aarkue/rust-bridge-process-mining/).

- `log_strip`: CLI for Stripping XES Attributes
- `event_hours_analyzer`: Python Script for Data Visualization
- `ocel_graph`: Web Service for Constructing Graphs from OCED
- `petri_net_wasm`: Petri Net Editor with PNML Support via WASM

All of these projects require Rust (see https://www.rust-lang.org/tools/install) and all of them except `log_strip` also require [Node.js](https://nodejs.org/en/download/) to be installed.


## `log_strip`
![log_stripper](https://github.com/aarkue/process_mining_demos/assets/20766652/a0c7cca1-4b1e-4b3c-9aae-5a23a57be24e)

### Setup
1. `cargo run --release -- -i <input-file> -o <output-file>`

## `event_hours_analyzer`
![hour_plotter](https://github.com/aarkue/process_mining_demos/assets/20766652/2e1302a6-4a92-4da6-8b48-9f99d0176303)

### Setup
1. Create and activate a virtual Python environment (e.g., `python -m venv venv` and `source ./venv/bin/activate`)
2. Install [maturin](https://www.maturin.rs/) `pip install maturin`
3. `maturin develop --release`
4. Execute the Jupyter notebook `event_hours_analyzer.ipynb` using the same Python environment

## `ocel_graph`
![ocel_graph](https://github.com/aarkue/process_mining_demos/assets/20766652/426d9dc9-0a2b-487e-b49b-b349c68fc348)

### Setup
1. Start the backend (`cd backend` and `cargo run --release`)
2. Start the frontend (`cd frontend`, `npm i`, and run `npm run dev`)
3. Open the specified URL in the browser

## `petri_net_wasm`
![petri_net_editor](https://github.com/aarkue/process_mining_demos/assets/20766652/c73db314-c6be-4f9e-99d9-572b7ee58965)

### Setup
1. Build the WASM library (`wasm-pack build --target web --release`)
2. Run the frontend (`npm i` and `npm run dev`)
3. Open the specified URL in the browser
