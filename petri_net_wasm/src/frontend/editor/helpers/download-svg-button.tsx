import { Graphviz } from "@hpcc-js/wasm";
import { useReactFlow } from "reactflow";
import { WorkerAPI } from "../../types";
import { editorToJsonPN } from "./pn_json";
import { PanelButton } from "../Editor";

function downloadImage(dataUrl: string) {
  const a = document.createElement("a");

  a.setAttribute("download", "png.svg");
  a.setAttribute("href", dataUrl);
  a.click();
}

function DownloadSVGButton({ workerAPI }: { workerAPI: WorkerAPI }) {
  const { getNodes, getEdges } = useReactFlow();

  async function onClick() {
    const pn = editorToJsonPN(getNodes(), getEdges());
    const dot = await workerAPI.petri_net_to_dot(JSON.stringify(pn));
    const gv = await Graphviz.load();
    const layout_res_svg = gv.layout(dot, "svg", "dot");
    const blob = new Blob([layout_res_svg], { type: "image/svg+xml" });
    downloadImage(URL.createObjectURL(blob));
  }

  return (
    <>
      <PanelButton onClick={() => onClick()}>Download SVG</PanelButton>
    </>
  );
}

export default DownloadSVGButton;
