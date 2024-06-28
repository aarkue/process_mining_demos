import { Edge, MarkerType, Node } from "reactflow";
import { PetriNet } from "../../types";

import { v4 as uuidv4 } from "uuid";
import { NodeData } from "../TransitionNode";

export function editorToJsonPN(
  nodes: Node<{ label?: string }>[],
  edges: Edge<unknown>[],
): PetriNet {
  const pn: PetriNet = { places: {}, transitions: {}, arcs: [] };
  for (const node of nodes) {
    if (node.type === "transition") {
      pn.transitions[node.id] = { id: node.id, label: node.data.label ?? null };
    } else {
      pn.places[node.id] = { id: node.id };
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

  const places: Node<unknown>[] = Object.values(pn.places).map((t) => ({
    id: t.id,
    type: "place",
    data: {},
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
