import { useReactFlow } from "reactflow";
import { PetriNet, WorkerAPI } from "../../types";

import { pnJsonToEditor } from "./pn_json";
import { applyElkLayoutToNodes } from "./Layout";

function ImportPNMLButton({ workerAPI }: { workerAPI: WorkerAPI }) {
  const { setNodes, setEdges, fitView } = useReactFlow();
  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    if (ev.currentTarget.files == null || ev.currentTarget.files.length < 1) {
      return;
    }
    const file = ev.currentTarget.files[0];
    const pnmlString = await file.text();
    const pn: PetriNet = JSON.parse(await workerAPI.import_pnml(pnmlString));

    const { nodes, edges } = pnJsonToEditor(pn);
    await applyElkLayoutToNodes(nodes, edges);
    setNodes(nodes);
    setEdges(edges);
    setTimeout(() => {
      fitView({ padding: 1 });
    }, 100);
  };

  return (
    <div className="px-2 rounded py-2 text-sm flex items-center bg-white border">
      <span className="font-semibold mr-2">Import PNML:</span>
      <input
        type="file"
        className="w-[5rem]"
        onChange={onChange}
        accept=".pnml"
      />
    </div>
  );
}

export default ImportPNMLButton;
