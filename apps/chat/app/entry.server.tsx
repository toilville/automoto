import { PassThrough, Transform } from "node:stream";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import {
  createDOMRenderer,
  RendererProvider,
  SSRProvider,
  renderToStyleElements,
} from "@fluentui/react-components";
import type { EntryContext } from "react-router";

export const streamTimeout = 5_000;

function createFluentStyleTransform(renderer: ReturnType<typeof createDOMRenderer>) {
  let injected = false;
  let buffer = "";
  const styleMarkup = renderToStaticMarkup(<>{renderToStyleElements(renderer)}</>);

  return new Transform({
    transform(chunk, _encoding, callback) {
      if (injected) {
        callback(null, chunk);
        return;
      }

      buffer += chunk.toString();
      const headCloseIndex = buffer.indexOf("</head>");
      if (headCloseIndex === -1) {
        callback();
        return;
      }

      const beforeHeadClose = buffer.slice(0, headCloseIndex);
      const afterHeadClose = buffer.slice(headCloseIndex);
      injected = true;
      buffer = "";

      callback(null, `${beforeHeadClose}${styleMarkup}${afterHeadClose}`);
    },
    flush(callback) {
      if (!injected && buffer.length > 0) {
        callback(null, buffer);
        return;
      }
      callback();
    },
  });
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const timeoutId = setTimeout(() => abort(), streamTimeout + 1000);

    const renderer = createDOMRenderer();
    const { pipe, abort } = renderToPipeableStream(
      <RendererProvider renderer={renderer}>
        <SSRProvider>
          <ServerRouter context={routerContext} url={request.url} />
        </SSRProvider>
      </RendererProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const fluentStyleTransform = createFluentStyleTransform(renderer);
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(fluentStyleTransform).pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(() => clearTimeout(timeoutId), 0);
  });
}
