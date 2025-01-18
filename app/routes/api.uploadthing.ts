import type { ActionFunctionArgs } from "@remix-run/node"; // or cloudflare/deno

import { createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = (args: ActionFunctionArgs) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ event }) => {
      // This code runs on your server before upload
      const user = await auth(event);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export const { action, loader } = createRouteHandler({
  router: uploadRouter,
  // Apply an (optional) custom config:
  // config: { ... },
});


export type UploadRouter = typeof uploadRouter;
