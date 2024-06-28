export const MODE_OPTIONS = [
  "Import XES & Alpha+++ Discovery",
  "Import OCEL2 JSON",
  "Import OCEL2 XML",
] as const;
type OCELShim = {
  eventTypes: unknown[];
  objectTypes: unknown[];
  events: unknown[];
  objects: unknown[];
};
export type MODE_OPTION_RES = [
  {
    places: Record<string, { id: string }>;
    transitions: Record<string, { id: string; label: string }>;
    arcs: unknown[];
  },
  OCELShim,
  OCELShim,
];

import * as Comlink from "comlink";

export type ResultInfoProps = (
  | {
      mode: (typeof MODE_OPTIONS)[0];
      data: MODE_OPTION_RES[0];
    }
  | {
      mode: (typeof MODE_OPTIONS)[1];
      data: MODE_OPTION_RES[1];
    }
  | {
      mode: (typeof MODE_OPTIONS)[2];
      data: MODE_OPTION_RES[2];
    }
) & { workerAPI: Comlink.Remote<WorkerAPI> };

export type Mode = (typeof MODE_OPTIONS)[number];

export interface WorkerAPI {
  discover_petri_net_from_xes: (
    xes: Uint8Array,
    isGz: boolean,
  ) => Promise<string>;
  petri_net_to_dot: (json: string) => Promise<string>;
  import_pnml: (pnml: string) => Promise<string>;
  export_pnml: (json: string) => Promise<string>;
  init: () => Promise<unknown>;
}

export type PetriNet = {
  places: Record<string, PetriNetPlace>;
  transitions: Record<string, PetriNetTransition>;
  arcs: PetriNetArc[];
  final_markings?: Record<string, number>[];
  initial_marking?: Record<string, number>;
};

export type PetriNetPlace = {
  id: string;
};

export type PetriNetTransition = {
  id: string;
  label: string | null;
};

export type PetriNetArc = {
  from_to: {
    type: "TransitionPlace" | "PlaceTransition";
    nodes: [string, string];
  };
  weight: number;
};
