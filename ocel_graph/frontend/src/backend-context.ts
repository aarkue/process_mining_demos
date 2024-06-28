import { createContext } from "react";
import type { OCELGraphOptions } from "./types/generated/OCELGraphOptions";
import type { OCELEvent, OCELInfo, OCELObject } from "./types/ocel";
export type BackendProvider = {
  "ocel/info": () => Promise<OCELInfo>;
  "ocel/upload": (file: File) => Promise<OCELInfo>;
  "ocel/graph": (options: OCELGraphOptions) => Promise<{
    nodes: (OCELEvent | OCELObject)[];
    links: { source: string; target: string; qualifier: string }[];
  }>;
};

export async function warnForNoBackendProvider<T>(): Promise<T> {
  console.warn("No BackendProviderContext!");
  return await new Promise<T>((_resolve, reject) => {
    reject(Error("No BackendProviderContext"));
  });
}

export const BackendProviderContext = createContext<BackendProvider>({
  "ocel/info": warnForNoBackendProvider,
  "ocel/graph": warnForNoBackendProvider,
  "ocel/upload": warnForNoBackendProvider,
});

export const API_WEB_SERVER_BACKEND_PROVIDER: BackendProvider = {
  "ocel/info": async () => {
    const res = await fetch("http://localhost:3000/ocel/info", {
      method: "get",
    });
    return await res.json();
  },
  "ocel/upload": async (ocelFile) => {
    const type = ocelFile.name.endsWith(".json") ? "json" : "xml";
    return await (
      await fetch(`http://localhost:3000/ocel/upload-${type}`, {
        method: "post",
        body: ocelFile,
      })
    ).json();
  },
  "ocel/graph": async (options) => {
    const res = await fetch("http://localhost:3000/ocel/graph", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    console.log({ res });
    if (res.ok) {
      return await res.json();
    } else {
      throw new Error(res.statusText);
    }
  },
};
