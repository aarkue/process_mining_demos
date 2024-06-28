/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { Edge, useReactFlow, type Node } from "reactflow";
import { WorkerAPI } from "../../types";
import { Graphviz } from "@hpcc-js/wasm";

import ELK, { LayoutOptions, type ElkNode } from "elkjs/lib/elk.bundled.js";
import { editorToJsonPN } from "./pn_json";
const elk = new ELK();
const defaultOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": 100,
  "org.eclipse.elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
  "org.eclipse.elk.layered.nodePlacement.favorStraightEdges": "false",
  "elk.spacing.nodeNode": 50,
  "elk.spacing.edgeNode": 50,

  "elk.direction": "RIGHT",
};

export const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

  const getLayoutedElements = useCallback(
    async (
      variant: "elk" | "graphviz",
      workerAPI: WorkerAPI,
      fitViewAfter: boolean = true,
    ) => {
      const nodes: Node<{ label?: string }>[] = [...getNodes()];
      const edges = getEdges();

      void (
        variant === "elk"
          ? applyElkLayoutToNodes(nodes, edges)
          : applyGraphvizLayoutToNodes(nodes, edges, workerAPI)
      ).then(() => {
        setNodes(nodes);
        if (fitViewAfter) {
          setTimeout(() => {
            fitView();
          }, 50);
        }
      });
    },
    [fitView, getEdges, getNodes, setNodes],
  );

  return { getLayoutedElements };
};

export async function applyGraphvizLayoutToNodes(
  nodes: Node<{ label?: string }>[],
  edges: Edge<any>[],
  workerAPI: WorkerAPI,
) {
  const pn = editorToJsonPN(nodes, edges);
  const dot = await workerAPI.petri_net_to_dot(JSON.stringify(pn));
  const gv = await Graphviz.load();
  const layout_res_json = gv.layout(dot, "json", "dot");
  const layout_res: { objects: { name: string; pos: string }[] } =
    JSON.parse(layout_res_json);
  nodes.forEach((n) => {
    const gn = layout_res.objects.find((x) => x.name == n.id);
    if (gn) {
      const [x, y] = gn.pos.split(",");
      n.position.x = 2 * parseFloat(x);
      n.position.y = 2 * parseFloat(y);
    }
  });
}

export async function applyElkLayoutToNodes(
  nodes: Node<{ label?: string }>[],
  edges: Edge<any>[],
  options: Partial<LayoutOptions> = {},
) {
  const layoutOptions = { ...defaultOptions, ...options };
  const graph = {
    id: "root",
    layoutOptions,
    children: nodes.map((n) => {
      return {
        id: n.id,
        width: n.width ?? (n.type === "transition" ? 130 : 66),
        height: n.height ?? (n.type === "transition" ? 64 : 66),
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.sourceHandle ?? e.source],
      targets: [e.targetHandle ?? e.target],
    })),
  };
  await elk.layout(graph as any).then(({ children }: ElkNode) => {
    if (children !== undefined) {
      children.forEach((node) => {
        const n = nodes.find((n) => n.id === node.id);
        if (n !== undefined) {
          n.position = { x: node.x ?? 0, y: node.y ?? 0 };
        } else {
          console.warn("[Layout] Node not found: " + node.id);
        }
      });
    }
  });
}
