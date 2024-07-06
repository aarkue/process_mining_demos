import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  NodeOrigin,
  OnConnectEnd,
  OnConnectStart,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import TransitionNode from "./TransitionNode";
import CustomEdge from "./CustomEdge";
import PlaceNode from "./PlaceNode";
import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { Connection, Edge, Node, ReactFlowJsonObject } from "reactflow";
import DownloadSVGButton from "./helpers/download-svg-button";
import ImportPNMLButton from "./helpers/import-pnml-button";
import { applyElkLayoutToNodes, useLayoutedElements } from "./helpers/Layout";

import * as Comlink from "comlink";
import workerImport from "../worker?worker&url";
import { WorkerAPI } from "../types";

import { v4 as uuidv4 } from "uuid";
import ExportPNMLButton from "./helpers/export_pnml";
import { pnJsonToEditor } from "./helpers/pn_json";

const nodeTypes = {
  transition: TransitionNode,
  place: PlaceNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

let worker: Worker | undefined;
let workerAPI: Comlink.Remote<WorkerAPI>;

function InnerEditor() {
  const [workerStatus, setWorkerStatus] = useState<
    "initial" | "ready" | "busy" | "error"
  >("initial");
  const prevData = useMemo(() => {
    const prevDataJSON = localStorage.getItem("pn-editor");
    if (prevDataJSON != null) {
      try {
        const prevData: ReactFlowJsonObject = JSON.parse(prevDataJSON);
        return prevData;
      } catch (e) {
        console.warn("Could not parse previous data", { prevDataJSON });
      }
    }
  }, []);
  useEffect(() => {
    console.log({ workerImport });
    if (worker === undefined) {
      worker = new Worker(new URL(workerImport, import.meta.url), {
        type: "module",
      });
      // worker = new workerImport();
      workerAPI = Comlink.wrap<WorkerAPI>(worker);
      workerAPI
        .init()
        .then(() => {
          console.log("Init!");
          setWorkerStatus("ready");
        })
        .catch((e) => {
          console.error(e);
          setWorkerStatus("error");
        });
    }
  }, []);

  const store = useStoreApi();
  const instance = useReactFlow();
  const initialIDs = prevData === undefined ? [uuidv4(), uuidv4()] : [];
  const [nodes, setNodes, onNodesChange] = useNodesState<{ label?: string }>(
    prevData?.nodes ?? [
      {
        id: initialIDs[0],
        type: "place",
        data: {},
        position: { x: 0, y: 0 },
      },
      {
        id: initialIDs[1],
        type: "transition",
        data: { label: "Place Order" },
        position: { x: 150, y: 0 },
      },
    ],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    prevData?.edges ?? [
      {
        source: initialIDs[0],
        target: initialIDs[1],
        id: uuidv4(),
        type: "custom",
        markerEnd: {
          color: "black",
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
        },
      },
    ],
  );

  useEffect(() => {
    setTimeout(() => {
      instance.fitView({ padding: 1 });
    }, 100);
  }, [instance, setEdges, setNodes]);

  const connectingNodeId = useRef<string | null>(null);

  const { getLayoutedElements } = useLayoutedElements();

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const { nodeInternals } = store.getState();

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const getChildNodePosition = (event: MouseEvent) => {
        const panePosition = instance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        return panePosition;
      };

      // we only want to create a new node if the connection ends on the pane
      const targetIsPane = (event.target as Element).classList.contains(
        "react-flow__pane",
      );

      const parentNode = nodeInternals.get(connectingNodeId.current!)!;
      const childNodePosition = getChildNodePosition(event as MouseEvent);

      if (targetIsPane && connectingNodeId.current) {
        const newNode: Node = {
          id: uuidv4(),
          type: parentNode.type === "place" ? "transition" : "place",
          data: { label: "New Node" },
          position: childNodePosition,
        };

        const newEdge: Edge<unknown> = {
          id: uuidv4(),
          source: parentNode.id,
          target: newNode.id,
          type: "custom",
          markerEnd: {
            color: "black",
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
          },
        };
        setNodes([...nodes, newNode]);
        setEdges([...edges, newEdge]);
      }
    },
    [edges, instance, nodeInternals, nodes, setEdges, setNodes],
  );

  useEffect(() => {
    const o = instance.toObject();
    localStorage.setItem("pn-editor", JSON.stringify(o));
  }, [instance, nodes, edges]);

  const onConnect = useCallback(
    (c: Edge | Connection) => {
      const { source, target, sourceHandle, targetHandle } = c;
      const sourceNode = nodeInternals.get(source!)!;
      const targetNode = nodeInternals.get(target!)!;
      if (sourceNode.type === targetNode.type) {
        return;
      }
      requestAnimationFrame(() => {
        const h = c.sourceHandle;
        console.log(
          { sourceNode, targetNode, sourceHandle, targetHandle, c },
          c.sourceHandle,
          h,
        );
        setEdges((eds) => {
          const newEds = [...eds];
          const newEdge = {
            id: uuidv4(),
            source: h === sourceNode.type ? source! : target!,
            target: h === sourceNode.type ? target! : source!,
            type: "custom",
            markerEnd: {
              color: "black",
              type: MarkerType.ArrowClosed,
              width: 25,
              height: 25,
            },
          };
          newEds.push(newEdge);
          return newEds;
        });
      });
    },
    [setEdges, nodeInternals],
  );

  const nodeOrigin: NodeOrigin = [0.5, 0.5];
  return (
    <ReactFlow
      className="border rounded"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeOrigin={nodeOrigin}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onConnect={onConnect}
      snapToGrid={true}
      snapGrid={[10, 10]}
      maxZoom={7}
      minZoom={0.33}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        color="#ccc"
        variant={BackgroundVariant.Cross}
        gap={[50, 50]}
        offset={2}
      />
      <Controls showInteractive={false} />
      <Panel
        position="top-center"
        className="flex justify-start gap-2 w-full px-4 bg-white flex-wrap"
      >
        <div
          className={`px-2 rounded py-2 font-semibold ${
            workerStatus === "ready"
              ? "bg-green-100 text-green-900 border-green-500 border-2"
              : "bg-white"
          } border`}
        >
          WASM Worker <br />
          {workerStatus}
        </div>{" "}
        <div style={{ width: "1rem" }}></div>
        <div className="px-2 rounded py-2 text-sm flex items-center bg-fuchsia-100 border-fuchsia-400 border">
          <span className="font-semibold mr-2">
            Discover from XES
            <br />
            (Alpha+++)
          </span>
          <input
            accept=".xes,.xes.gz"
            className="w-[5rem]"
            type="file"
            onChange={async (ev) => {
              if (ev.currentTarget.files?.length) {
                const file = ev.currentTarget.files[0];
                if (file) {
                  console.log({ file }, file.type);
                  const pnJson = await workerAPI.discover_petri_net_from_xes(
                    new Uint8Array(await file.arrayBuffer()),
                    file.name.endsWith(".gz"),
                  );
                  const pn = JSON.parse(pnJson);

                  const { nodes, edges } = pnJsonToEditor(pn);
                  await applyElkLayoutToNodes(nodes, edges);
                  setNodes(nodes);
                  setEdges(edges);
                }
              }
            }}
          />
        </div>
        <div style={{ width: "1rem" }}></div>
        <ImportPNMLButton workerAPI={workerAPI} />
        <ExportPNMLButton workerAPI={workerAPI} />
        <div style={{ width: "1rem" }}></div>
        <PanelButton
          onClick={() => {
            getLayoutedElements("elk", workerAPI, true);
          }}
        >
          Layout (Elk)
        </PanelButton>
        <PanelButton
          onClick={() => {
            getLayoutedElements("graphviz", workerAPI, true);
          }}
        >
          Layout (Dot)
        </PanelButton>
        {/* <div style={{ width: "1rem" }}></div> */}
        <DownloadSVGButton workerAPI={workerAPI} />
        <div style={{ width: "1rem" }}></div>
        <PanelButton
          onClick={() => {
            setNodes([
              ...nodes,
              {
                id: uuidv4(),
                type: "place",
                position: { x: 0, y: 0 },
                data: {},
              },
            ]);
          }}
        >
          Add Place
        </PanelButton>
        <PanelButton
          onClick={() => {
            setNodes([
              ...nodes,
              {
                id: uuidv4(),
                type: "transition",
                position: { x: 0, y: 0 },
                data: { label: "New" },
              },
            ]);
          }}
        >
          Add Transition
        </PanelButton>
        <PanelButton
          onClick={() => {
            const initialIDs = [uuidv4(), uuidv4()];
            setNodes([
              {
                id: initialIDs[0],
                type: "place",
                data: {},
                position: { x: 0, y: 0 },
              },
              {
                id: initialIDs[1],
                type: "transition",
                data: { label: "Place Order" },
                position: { x: 150, y: 0 },
              },
            ]);
            setEdges([
              {
                source: initialIDs[0],
                target: initialIDs[1],
                id: uuidv4(),
                type: "custom",
                markerEnd: {
                  color: "black",
                  type: MarkerType.ArrowClosed,
                  width: 25,
                  height: 25,
                },
              },
            ]);
            setTimeout(() => {
              instance.fitView({ padding: 2 });
            }, 100);
          }}
        >
          Reset
        </PanelButton>
      </Panel>
    </ReactFlow>
  );
}

export default function Editor() {
  return (
    <ReactFlowProvider>
      <InnerEditor />
    </ReactFlowProvider>
  );
}

export function PanelButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => unknown;
}) {
  return (
    <button
      className="px-2 rounded py-2 bg-white border font-semibold hover:bg-blue-100"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
