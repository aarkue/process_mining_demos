import { Handle, Node, NodeProps, Position, useReactFlow } from "reactflow";
import DeleteButton from "./DeleteButton";

export default function PlaceNode({
  id,
  data,
}: NodeProps<{ initialTokens?: number }>) {
  const { setNodes } = useReactFlow();
  return (
    <>
      <div className="place-node">
        <DeleteButton nodeID={id} />
        <div className="dragHandle">
          <button
            className="bg-white w-full h-full rounded-full flex items-center justify-center"
            onDoubleClickCapture={() => {
              console.log("on click");
              setNodes((nodes) => {
                const newNodes = [...nodes];
                const node: Node<{ initialTokens?: number }> | undefined =
                  newNodes.find((n) => n.id === id);
                if (node) {
                  console.log("Found node!", node.data.initialTokens);
                  if (
                    node.data.initialTokens !== undefined &&
                    node.data.initialTokens > 0
                  ) {
                    node.data = { initialTokens: undefined };
                  } else {
                    node.data = { initialTokens: 1 };
                  }
                }
                return newNodes;
              });
            }}
          >
            {/* {data.initialTokens} */}
            {Array(data.initialTokens ?? 0)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-black"></div>
              ))}
          </button>
        </div>
        <Handle
          onConnect={(c) => (c.sourceHandle = "place")}
          type="target"
          position={Position.Top}
        />
        <Handle
          onConnect={(c) => (c.sourceHandle = "place")}
          type="source"
          position={Position.Bottom}
        />
      </div>
    </>
  );
}
