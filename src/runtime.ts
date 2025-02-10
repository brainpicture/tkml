import { TKML } from "./index";

// Runtime class to handle all TKML actions
export class Runtime {
    private instanceId: number;
    private static counter = 0;
    private tkmlInstance: TKML;

    constructor(tkmlInstance: TKML) {
        this.instanceId = ++Runtime.counter;
        this.tkmlInstance = tkmlInstance;
    }

    public go(url: string) {
        url = decodeURIComponent(url);

        this.tkmlInstance.load(url, true);
    }

    public loader(element: HTMLElement) {
        element.innerHTML = 'Loading...';
        return this;
    }

    public getId(): number {
        return this.instanceId;
    }
}

// Global registry for runtime instances
(window as any).TKML_RUNTIMES = new Map<number, Runtime>();

// Helper function for inline calls
(window as any).tkmlr = function (instanceId: number): Runtime {
    const runtime = (window as any).TKML_RUNTIMES.get(instanceId);
    if (!runtime) {
        throw new Error(`Runtime instance with id ${instanceId} not found`);
    }
    return runtime;
};
