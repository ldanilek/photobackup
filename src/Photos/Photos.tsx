"use client";

import { UploadDropzone, UploadFileResponse } from "@xixixao/uploadstuff/react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function Photos({ viewer }: { viewer: Id<"users"> }) {
  return <>
  <div className="flex items-center justify-around">
    <PhotoUploader viewer={viewer} />
    <DropboxBackup />
  </div>
  <PhotoList viewer={viewer} />
  </>;
}

export function DropboxBackup() {
  const isDropboxLinked = useQuery(api.dropbox.isLinked);
  const setCsrfUrl = useQuery(api.dropbox.setCsrfUrl);
  const linkDropbox = useMutation(api.dropbox.link);
  const backup = useMutation(api.files.backupToDropbox);
  if (isDropboxLinked === undefined) {
    return null;
  }
  if (!isDropboxLinked) {
    return <Button onClick={() => {
      void (async () => {
        const resp = await fetch(setCsrfUrl!, {
          method: "POST",
        });
        if (!resp.ok) {
          throw new Error(await resp.text());
        }
        const csrfToken = await resp.text();
        const redirectUrl = await linkDropbox({ csrfToken });
        window.open(redirectUrl, "_blank");
      })();
    }}>Link Dropbox</Button>;
  }
  return <Button onClick={() => {
    void backup();
  }}>Backup to Dropbox</Button>;
}

export function PhotoList({ viewer }: { viewer: Id<"users"> }) {
  const photos = useQuery(api.files.list);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos?.map((photo) => (
        <div key={photo._id} className="w-full aspect-fit">
          <img src={photo.storageUrl!} alt="Uploaded" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

export function PhotoUploader({ viewer }: { viewer: Id<"users"> }) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveStorageIds = useMutation(api.files.saveStorageIds);
  const saveAfterUpload = async (uploaded: UploadFileResponse[]) => {
    await saveStorageIds({
      storageIds: uploaded.map(({ response }) => ({
        storageId: (response as any).storageId,
      })),
    });
  };
 
  return (
    <UploadDropzone
      uploadUrl={generateUploadUrl}
      fileTypes={{
        "application/pdf": [".pdf"],
        "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      }}
      multiple
      onUploadComplete={saveAfterUpload}
      onUploadError={(error: any) => {
        // Do something with the error.
        alert(`ERROR! ${error}`);
      }}
    />
  );
}
