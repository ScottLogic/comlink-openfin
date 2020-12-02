# comlink-openfin

ComLink (https://github.com/GoogleChromeLabs/comlink) provides an easy way to expose an API from a web worker / iframe by wrapping up postMessage and providing a proxy.

This package adds an OpenFin Inter-Application Bus endpoint to allow using ComLink but communicating via the OpenFin IAB rather than postMessage.

There is a single exported function:

```
openfinEndpoint(topic: string, remote?: fin.Identity): Comlink.Endpoint
```

| Parameter | Description                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `topic`   | The IAB topic name to send/receive messages using                                                                                                 |
| `remote`  | An optional OpenFin application uuid for the other end (sender or receiver). Sends as broadcast and accepts messages from any uuid if unspecified |

## The exposed API

```
import * as Comlink from "comlink";
import { openfinEndpoint } from "comlink-openfin";

const api: Api = {
  callMe: (a: string): string => `Received "${a}"`;
};

Comlink.expose(api, openfinEndpoint("Topic name"));
```

## The API client

```
import * as Comlink from "comlink";
import { openfinEndpoint } from "comlink-openfin";

const remote = Comlink.wrap<Api>(openfinEndpoint("Topic name"));
const response = await remote.callMe("My message");
```

## Caveats

Comlink is designed for a single sender/receiver pair. Although specifying an OpenFin identity for the sender/receiver is optional, subscribing more than one sender/receiver using the same recipient is unlikely to work well (and will probably result in an infinite loop of malformed messages going back and forth between sender and receiver).
