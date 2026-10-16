
import { useState } from "react";

export default function PdfPreview({ resource }) {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003366]"
            >
                Preview PDF
            </button>

            {showPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
                    onClick={() => setShowPreview(false)}
                >
                    <div
                        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-6">
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                                    {resource.title}
                                </h2>
                                <p className="truncate text-xs text-gray-500">
                                    {resource.filename}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <a
                                    href={resource.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-500"
                                >
                                    Download
                                </a>

                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    aria-label="Close PDF preview"
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <iframe
                            src={resource.previewUrl}
                            title={`PDF preview: ${resource.title}`}
                            className="min-h-0 w-full flex-1 bg-gray-100"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
