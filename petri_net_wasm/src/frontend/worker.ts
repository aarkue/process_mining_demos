import * as Comlink from "comlink";
import init, {
  wasm_discover_alphappp_petri_net_from_xes_vec,
  wasm_export_pnml,
  wasm_import_pnml,
  wasm_petri_net_dot,
} from "../../pkg/petri_net_wasm.js";
import type { WorkerAPI } from "./types.js";

const discover_petri_net_from_xes: WorkerAPI["discover_petri_net_from_xes"] =
  async (xes, isGz: boolean) => {
    const json = wasm_discover_alphappp_petri_net_from_xes_vec(xes, isGz);
    return json;
  };

Comlink.expose({
  discover_petri_net_from_xes,
  petri_net_to_dot: async (json) => {
    return wasm_petri_net_dot(json);
  },
  import_pnml: async (pnml: string) => {
    return wasm_import_pnml(pnml);
  },
  export_pnml: async (pn_json: string) => {
    return wasm_export_pnml(pn_json);
  },
  init: async () => {
    await init();
  },
} satisfies WorkerAPI);
