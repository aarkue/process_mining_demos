import { Edge, MarkerType, Node } from "reactflow";
import { PetriNet } from "../../types";

import { v4 as uuidv4 } from "uuid";
import { NodeData } from "../TransitionNode";

export function editorToJsonPN(
  nodes: Node<{ label?: string; initialTokens?: number }>[],
  edges: Edge<unknown>[],
): PetriNet {
  const pn: PetriNet = { places: {}, transitions: {}, arcs: [] };
  const initial_marking: Record<string, number> = {};
  for (const node of nodes) {
    if (node.type === "transition") {
      pn.transitions[node.id] = { id: node.id, label: node.data.label ?? null };
    } else {
      pn.places[node.id] = { id: node.id };
      if (node.data.initialTokens) {
        initial_marking[node.id] = node.data.initialTokens ?? 0;
      }
    }
  }
  for (const edge of edges) {
    pn.arcs.push({
      from_to: {
        type:
          pn.transitions[edge.source] !== undefined
            ? "TransitionPlace"
            : "PlaceTransition",
        nodes: [edge.source, edge.target],
      },
      weight: 1,
    });
  }
  if (Object.keys(initial_marking).length > 0) {
    pn.initial_marking = initial_marking;
  }
  return pn;
}

export function pnJsonToEditor(pn: PetriNet): { nodes: Node[]; edges: Edge[] } {
  const transitions: Node<NodeData>[] = Object.values(pn.transitions).map(
    (t) => ({
      id: t.id,
      type: "transition",
      data: { label: t.label ?? undefined },
      position: { x: 0, y: 0 },
    }),
  );

  const places: Node<{ initialTokens?: number }>[] = Object.values(
    pn.places,
  ).map((t) => ({
    id: t.id,
    type: "place",
    data: {
      initialTokens:
        pn.initial_marking !== undefined ? pn.initial_marking[t.id] : undefined,
    },
    position: { x: 0, y: 0 },
  }));

  const edges: Edge[] = pn.arcs.map((a) => ({
    source: a.from_to.nodes[0],
    target: a.from_to.nodes[1],
    id: uuidv4(),
    type: "custom",
    markerEnd: {
      color: "black",
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
    },
  }));
  return { nodes: [...transitions, ...places], edges };
}
