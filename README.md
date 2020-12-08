# comlink-openfin

ComLink (https://github.com/GoogleChromeLabs/comlink) is a great way to interact with web workers or iFrames whose only interaction is through [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage). Using ComLink, a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object is created on one side of the [MessageChannel](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) allowing you to interact with the exposed API on the other end of the channel as if it were running in the same context.

![ComLink handles messaging between the front-end and web workers](./comlink.svg)

[OpenFin](https://openfin.co/) builds on [Electron](https://www.electronjs.org/) and provides its own messaging channel (the Inter-Application Bus or IAB) that works between (and within) independent OpenFin applications allowing for cross-application integration and communication. It's a powerful mechanism that has the same problems as working with web workers - the need to manage transceiving messages between the applications.

Given ComLink already provides a simple mechanism for abstracting messages so that we can just work with the remote API as if it was local, it would be great if the same idea could work via the OpenFin IAB. This package enables exactly that - it provides a ComLink-compatible endpoint that manages messages sent or received via the OpenFin Inter-Application Bus making exposing an API between different parts of an OpenFin application or between different OpenFin applications only a couple of lines of code.

![ComLink-OpenFin handles messaging between OpenFin applications](./comlink-openfin.svg)

Using the endpoint is straight-forward: there is a single exported function that constructs it:

```
openfinEndpoint(topic: string, remote?: fin.Identity): Comlink.Endpoint
```

- `topic`: The IAB topic name to send/receive messages using - this should be unique and follow OpenFin guidelines
- `remote`: An optional OpenFin application uuid for the other end (sender or receiver) to enforce direct sender/receiver communication. If not specified, messages are broadcast to all topic listeners and received from any application on the same topic.

The sample code snippets below shows exposing an API, callMe, from one OpenFin application followed by creating the local proxy and calling the API from a completely different OpenFin application. ComLink wraps up the request to call the function including parameters and transfers it, via the IAB, to the other application where it is run. The response is similarly wrapped up and sent back over the IAB to the requesting application.

For those familiar with the existing Comlink API, the only change is the additional call to create the openfinEndpoint.

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
