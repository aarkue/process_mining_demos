import "./App.css";
import Editor from "./editor/Editor";

function App() {
  return (
    <>
      <div className="flex flex-col h-full w-full">
        <h1 className="font-black text-4xl mt-2">Petri Net Editor</h1>
        <div className="w-full h-full">
          <Editor />
        </div>
      </div>
    </>
  );
}

export default App;
