import { useContext, useEffect, useState } from "react";
import { BackendProviderContext } from "./backend-context";
import { OCELInfo } from "./types/ocel";
import toast from "react-hot-toast";
import OcelGraphViewer from "./OcelGraph";

function App() {
  const backend = useContext(BackendProviderContext);
  const [ocelInfo, setOcelInfo] = useState<OCELInfo>();
  useEffect(() => {
    backend["ocel/info"]()
      .then((info) => {
        setOcelInfo(info);
      })
      .catch((e) => {
        console.error(e);
        setOcelInfo(undefined);
      });
  }, [backend]);
  return (
    <>
      <div className="text-center px-4 mx-auto pt-4 w-full h-full flex flex-col">
        <h1 className="font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">OCEL Graph Explorer</h1>
        {ocelInfo && (
          <div className="mb-4">
            <h2 className="font-bold text-2xl text-green-700">OCEL Loaded</h2>
            {ocelInfo.num_events} Events and {ocelInfo.num_objects} Objects
          </div>
        )}
        {!ocelInfo && (
          <div className="mb-4">
            <h2 className="font-bold text-2xl text-orange-700">No OCEL Loaded</h2>
            Select an OCEL2.0 XML/JSON file below.
          </div>
        )}
        <OCELUploadForm onFinish={(info) => setOcelInfo(info)} />
        {ocelInfo && (
          <div className="w-full h-full py-2">
            <OcelGraphViewer ocelInfo={ocelInfo} />
          </div>
        )}
      </div>
    </>
  );
}

export default App;

const VALID_OCEL_MIME_TYPES = ["application/json", "text/json", "text/xml", "application/xml"];

function OCELUploadForm({ onFinish }: { onFinish: (ocelInfo: OCELInfo | undefined) => unknown }) {
  const backend = useContext(BackendProviderContext);
  function handleFileUpload(file: File | null) {
    if (backend["ocel/upload"] === undefined) {
      console.warn("No ocel/upload available!");
      return;
    }
    if (file != null) {
      void toast
        .promise(backend["ocel/upload"](file), {
          loading: "Importing file...",
          success: "Imported OCEL",
          error: "Failed to import OCEL",
        })
        .then((ocelInfo) => {
          if (ocelInfo != null) {
            onFinish(ocelInfo);
          } else {
            onFinish(undefined);
          }
        });
    }
  }
  return (
    <div>
      <div
        className="flex items-center justify-center w-full max-w-2xl mx-auto"
        onDragOver={(ev) => {
          ev.preventDefault();
          const items = ev.dataTransfer.items;
          if (items.length > 0 && items[0].kind === "file") {
            const fileMimeType = items[0].type;
            if (!VALID_OCEL_MIME_TYPES.includes(fileMimeType)) {
              const fileType = fileMimeType.length === 0 ? "" : `(${fileMimeType})`;
              console.warn(
                `Files of type ${fileType} are not supported!\n\nIf you are sure that this is an valid OCEL2 file, please select it manually by clicking on the dropzone.`,
                { id: "unsupported-file" }
              );
            }
          }
        }}
        onDrop={(ev) => {
          ev.preventDefault();
          const files = ev.dataTransfer.items;
          if (files.length > 0) {
            const fileWrapper = files[0];
            const file = fileWrapper.getAsFile();
            if (VALID_OCEL_MIME_TYPES.includes(file?.type ?? "")) {
              handleFileUpload(file);
            } else {
              const fileType = file?.type == null ? "" : `(${file?.type})`;
              toast(
                `Files of this type ${fileType} are not supported!\n\nIf you are sure that this is an valid OCEL2 file, please select it manually by clicking on the dropzone.`,
                { id: "unsupported-file" }
              );
            }
          }
        }}
      >
        <label
          htmlFor="dropzone-ocel-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-400 border-dashed rounded-lg cursor-pointer bg-blue-50/20 hover:bg-blue-100/30"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to select an OCEL file</span> or drag a file here
            </p>
            <p className="text-xs text-gray-500">Supported: OCEL2-JSON, OCEL2-XML</p>
          </div>
          <input
            onChange={(ev) => {
              if (ev.currentTarget.files !== null) {
                handleFileUpload(ev.currentTarget.files[0]);
              }
            }}
            id="dropzone-ocel-file"
            type="file"
            className="hidden"
            accept=".json, .xml"
          />
        </label>
      </div>
    </div>
  );
}
