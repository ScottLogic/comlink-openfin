import * as Comlink from "comlink";

type IabListener = (message: unknown, uuid: fin.Identity | string) => void;
const listeners = new Map<EventListenerOrEventListenerObject, IabListener>();

export const openfinEndpoint = (
  topic: string,
  remote?: fin.Identity
): Comlink.Endpoint => {
  if (!fin || !fin.InterApplicationBus) {
    throw new Error(
      "fin is undefined. This endpoint requires an OpenFin container."
    );
  }

  const me = fin.InterApplicationBus.me;
  if (remote != null && remote.uuid === me.uuid) {
    throw new Error(
      "The remote identity should not be yourself - you cannot be both the local and the remote"
    );
  }

  const targetIdentity: fin.Identity = remote != null ? remote : { uuid: "*" };

  // Ignore messages to self or not from the remote (when remote is specified)
  const allowIdentity =
    remote != null
      ? (uuid: string) => remote.uuid === uuid
      : (uuid: string) => me.uuid !== uuid;

  return {
    postMessage: sendOrBroadcast(topic, remote),
    addEventListener: async (
      _type: string,
      listener: EventListenerOrEventListenerObject,
      _options?: {} | undefined
    ): Promise<void> => {
      const handleEvent =
        "handleEvent" in listener ? listener.handleEvent : listener;

      const iabListener: IabListener = (
        message: unknown,
        origin: fin.Identity | string
      ) => {
        const uuid: string = getUuid(origin);
        const event = new MessageEvent("openFin", {
          data: message,
          origin: uuid,
        });

        if (allowIdentity(uuid)) {
          handleEvent(event);
        }
      };

      listeners.set(listener, iabListener);

      return await fin.InterApplicationBus.subscribe(
        targetIdentity,
        topic,
        iabListener
      );
    },

    removeEventListener: async (
      _type: string,
      listener: EventListenerOrEventListenerObject,
      _options?: {} | undefined
    ): Promise<void> => {
      const iabListener = listeners.get(listener);
      listeners.delete(listener);
      await fin.InterApplicationBus.unsubscribe(
        targetIdentity,
        topic,
        iabListener
      );
    },
  };
};

function sendOrBroadcast(topic: string, remote?: fin.Identity) {
  return remote != null
    ? async (message: any, _transfer?: Transferable[]): Promise<void> =>
        await fin.InterApplicationBus.send(remote, topic, message)
    : async (message: any, _transfer?: Transferable[]): Promise<void> =>
        await fin.InterApplicationBus.publish(topic, message);
}

function getUuid(origin: fin.Identity | string): string {
  return typeof origin === "string" ? origin : origin.uuid;
}
