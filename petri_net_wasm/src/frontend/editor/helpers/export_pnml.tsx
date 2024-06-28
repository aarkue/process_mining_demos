import { useReactFlow } from "reactflow";
import { editorToJsonPN } from "./pn_json";
import { WorkerAPI } from "../../types";
import { PanelButton } from "../Editor";

function downloadPNML(dataUrl: string) {
  const a = document.createElement("a");

  a.setAttribute("download", "pn.pnml");
  a.setAttribute("href", dataUrl);
  a.click();
}

function ExportPNMLButton({ workerAPI }: { workerAPI: WorkerAPI }) {
  const { getNodes, getEdges } = useReactFlow();
  const onClick = async () => {
    const pn = editorToJsonPN(getNodes(), getEdges());
    const pnml = await workerAPI.export_pnml(JSON.stringify(pn));
    const blob = new Blob([pnml], { type: "application/xml" });
    downloadPNML(URL.createObjectURL(blob));
  };

  return (
    <>
      <PanelButton onClick={() => onClick()}>Export PNML</PanelButton>
    </>
  );
}

export default ExportPNMLButton;
