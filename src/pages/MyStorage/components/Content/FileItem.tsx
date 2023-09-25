import { Api } from "api";
import { EncryptionStatus, File as FileType } from "api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  HiDocumentDuplicate,
  HiDotsVertical,
  HiOutlineDownload,
  HiOutlineShare,
  HiOutlineEye,
  HiOutlineTrash,
  HiDocumentText,
  HiOutlineLockOpen,
  HiLockClosed,
} from "react-icons/hi";
import { getFileExtension, getFileIcon, viewableExtensions } from "./utils";
import { formatBytes, formatUID } from "utils";
import { toast } from "react-toastify";
import { useDropdown, useFetchData } from "hooks";
import { useRef, useState, Fragment } from "react";
import copy from "copy-to-clipboard";
import {
  blobToArrayBuffer,
  decryptFileBuffer,
} from "utils/encryption/filesCipher";
import React from "react";
import { useAppDispatch } from "state";
import { PreviewImage, setImageViewAction } from "state/mystorage/actions";
import { truncate } from "utils/format";

dayjs.extend(relativeTime);

interface FileItemProps {
  file: FileType;
  view: "list" | "grid";
}

const FileItem: React.FC<FileItemProps> = ({ file, view }) => {
  const dispatch = useAppDispatch();
  const { fetchRootContent } = useFetchData();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const fileExtension = getFileExtension(file.name)?.toLowerCase() || "";
  useDropdown(ref, open, setOpen);

  const onCopy = (event: React.MouseEvent) => {
    if (event.shiftKey) return;
    copy(`https://staging.joinhello.app/file/${file.uid}`);
    toast.success("copied CID");
  };

  // Function to handle file download
  const handleDownload = () => {
    toast.info("Downloading " + file.name + "...");
    // Make a request to download the file with responseType 'blob'
    Api.get(`/file/download/${file.uid}`, { responseType: "blob" })
      .then(async (res) => {
        // Create a blob from the response data
        let binaryData = res.data;
        if (file.encryption_status === EncryptionStatus.Encrypted) {
          const originalCid = file.cid_original_encrypted;
          binaryData = await blobToArrayBuffer(binaryData);
          binaryData = await decryptFileBuffer(binaryData, originalCid);
        }
        const blob = new Blob([binaryData], { type: file.mime_type });

        // Create a link element and set the blob as its href
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name; // Set the file name
        a.click(); // Trigger the download
        toast.success("Download complete!");

        // Clean up
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Error downloading file:", err);
      });
  };

  const handleView = () => {
    Api.get(`/file/download/${file.uid}`, { responseType: "blob" })
      .then(async (res) => {
        let binaryData = res.data;
        if (file.encryption_status === EncryptionStatus.Encrypted) {
          const originalCid = file.cid_original_encrypted;
          binaryData = await blobToArrayBuffer(binaryData);
          binaryData = await decryptFileBuffer(binaryData, originalCid);
        }
        const blob = new Blob([binaryData], { type: file.mime_type });
        if (!blob) {
          console.error("Error downloading file:", file);
          return;
        }
        const url = window.URL.createObjectURL(blob);

        let mediaItem: PreviewImage;
        if (file.mime_type.startsWith("video/")) {
          mediaItem = {
            type: "htmlVideo",
            videoSrc: url,
            alt: file.name,
          };
        } else if (
          file.mime_type === "application/pdf" ||
          file.mime_type === "text/plain"
        ) {
          window.open(url, "_blank"); // PDF or TXT in a new tab
          return;
        } else {
          mediaItem = {
            src: url,
            alt: file.name,
          };
        }

        dispatch(setImageViewAction({ img: mediaItem, show: true }));
      })
      .catch((err) => {
        console.error("Error downloading file:", err);
      });
  };

  const handleDelete = () => {
    // Make a request to delete the file with response code 200
    Api.delete(`/file/delete/${file.uid}`)
      .then((res) => {
        console.log(res);
        toast.success("File deleted!");
        fetchRootContent();
      })
      .catch((err) => {
        console.error("Error deleting file:", err);
      });
  };

  if (view === "list")
    return (
      <>
        <th
          onDoubleClick={handleView}
          scope="row"
          className="px-3 py-1 font-medium text-gray-900 whitespace-nowrap"
        >
          <div className="flex items-center gap-3">
            {getFileIcon(file.name)}
            <span className="hidden md:inline"> {truncate(file.name, 40)}</span>
            <span className="inline md:hidden"> {truncate(file.name, 24)}</span>
          </div>
        </th>
        <td className="py-1 pr-8">
          <div
            className="flex items-center gap-1 select-none hover:text-blue-500"
            onClick={onCopy}
          >
            {formatUID(file.cid)}
            <HiDocumentDuplicate />
          </div>
        </td>
        <td className="py-1 pr-8 whitespace-nowrap">
          {formatBytes(file.size)}
        </td>
        <td className="py-1 pr-8">
          <div className="flex items-center">
            {file.encryption_status === "public" ? (
              <Fragment>
                <HiOutlineLockOpen />
                Public
              </Fragment>
            ) : (
              <Fragment>
                <HiLockClosed />
                Encrypted
              </Fragment>
            )}
          </div>
        </td>
        <td className="py-1 pr-8 whitespace-nowrap">
          {dayjs(file.updated_at).fromNow()}
        </td>
        <td className="py-1 pr-8 text-right">
          <button
            className="rounded-full hover:bg-gray-300 p-3"
            onClick={() => setOpen(!open)}
          >
            <HiDotsVertical />
            <div className="relative" ref={ref}>
              {open && (
                <div
                  id="dropdown"
                  className="absolute right-6 z-50 mt-2 bg-white shadow-lg text-left w-36 divide-y border"
                  style={{ bottom: "100%" }}
                >
                  <ul className="py-2">
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={handleDownload}
                    >
                      <HiOutlineDownload className="inline-flex mr-3" />
                      Download
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-gray-100">
                      <HiOutlineShare className="inline-flex mr-3" />
                      Share
                    </a>
                    {viewableExtensions.has(fileExtension) && (
                      <a
                        href="#"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleView()}
                      >
                        <HiOutlineEye className="inline-flex mr-3" />
                        View
                      </a>
                    )}
                  </ul>

                  <div className="py-2">
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={handleDelete}
                    >
                      <HiOutlineTrash className="inline-flex mr-3" />
                      Delete
                    </a>
                  </div>
                </div>
              )}
            </div>
          </button>
        </td>
      </>
    );
  else
    return (
      <div
        className="bg-white p-4 rounded-md mb-3 border border-gray-200 shadow-md hover:cursor-pointer hover:bg-gray-100"
        onClick={handleView}
      >
        <div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-1 bg-gray-100 rounded-md">
              <HiDocumentText className="w-7 h-7" />
            </div>
            <div className="font-medium text-gray-900 text-center overflow-hidden whitespace-nowrap w-full overflow-ellipsis">
              <span className="hidden md:inline">
                {truncate(file.name, 40)}
              </span>
              <span className="inline md:hidden">
                {truncate(file.name, 24)}
              </span>
            </div>
          </div>
        </div>
        <div
          className="text-center text-xs flex items-center justify-center gap-1 select-none hover:text-blue-500 mt-4"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onClick
            onCopy(e);
          }}
        >
          <label>{formatUID(file.cid)}</label>
          <HiDocumentDuplicate className="inline-block" />
        </div>
      </div>
    );
};

export default FileItem;
