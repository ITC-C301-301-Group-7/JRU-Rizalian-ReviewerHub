import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Eye,
    Download,
    Star,
    Flag,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

import PdfPreview from "../components/PdfPreview";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export default function PeerReviewerFeed() {
    const [resources, setResources] = useState([]);
    const [search, setSearch] = useState("");
    const [college, setCollege] = useState("All Colleges");
    const [selectedResource, setSelectedResource] = useState(null);
    const [ratings, setRatings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchResources = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/resources`);

            if (!response.ok) {
                throw new Error(`Failed to load reviewers (${response.status}).`);
            }

            const data = await response.json();

            setResources(
                (Array.isArray(data) ? data : []).map((item) => ({
                    ...item,
                    previewUrl: item.previewUrl?.startsWith("http")
                        ? item.previewUrl
                        : `${API_URL}${item.previewUrl || ""}`,
                    downloadUrl: item.downloadUrl?.startsWith("http")
                        ? item.downloadUrl
                        : `${API_URL}${item.downloadUrl || ""}`,
                }))
            );
        } catch (err) {
            setError(err.message || "Unable to load reviewer resources.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const colleges = [
        "All Colleges",
        ...new Set(
            resources
                .map((resource) => resource.college)
                .filter(Boolean)
        ),
    ];

    const filteredResources = resources.filter((resource) => {
        const term = search.toLowerCase();

        const matchesSearch = [
            resource.title,
            resource.courseCode,
            resource.author,
            resource.description,
            resource.filename,
        ].some((value) => String(value || "").toLowerCase().includes(term));

        const matchesCollege =
            college === "All Colleges" || resource.college === college;

        return matchesSearch && matchesCollege;
    });

    const handleRating = (resourceId, rating) => {
        setRatings((previous) => ({
            ...previous,
            [resourceId]: rating,
        }));
    };

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-5">
                {/* Search and filter */}
                <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                        <Search className="h-5 w-5 shrink-0 text-slate-400" />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search keywords, course codes, or authors..."
                            className="w-full border-0 bg-transparent py-3 text-sm text-slate-800 outline-none focus:ring-0"
                        />
                    </div>

                    <select
                        value={college}
                        onChange={(event) => setCollege(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#002147]"
                    >
                        {colleges.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={fetchResources}
                        disabled={loading}
                        title="Refresh reviewers"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#002147] hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </section>

                {/* Feed heading */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#002147] sm:text-2xl">
                            Peer Reviewer Feed
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Browse and preview shared learning resources.
                        </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm">
                        {filteredResources.length} resources
                    </span>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-12 text-slate-600 shadow-sm">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Loading reviewers...
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                        <p className="font-semibold">Could not load reviewers</p>
                        <p className="mt-1 text-sm">{error}</p>
                        <button
                            type="button"
                            onClick={fetchResources}
                            className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Reviewer cards */}
                {!loading && !error && (
                    <div className="space-y-4">
                        {filteredResources.map((resource) => {
                            const isPdf =
                                resource.mimeType === "application/pdf" ||
                                resource.filename?.toLowerCase().endsWith(".pdf");

                            return (
                                <article
                                    key={resource.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <span className="inline-flex rounded-md bg-[#002147] px-2.5 py-1 text-xs font-bold uppercase text-yellow-300">
                                                {resource.courseCode || "GENERAL"}
                                            </span>

                                            <h2 className="mt-2 break-words text-base font-extrabold text-slate-900 sm:text-lg">
                                                {resource.title}
                                            </h2>

                                            {resource.description && (
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {resource.description}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            aria-label={`Report ${resource.title}`}
                                            title="Report resource"
                                            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#002147]"
                                        >
                                            <Flag className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Rating UI */}
                                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-3">
                                        <span className="mr-2 text-sm font-semibold text-slate-700">
                                            Rate Usefulness:
                                        </span>

                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() =>
                                                    handleRating(resource.id, star)
                                                }
                                                aria-label={`Rate ${star} out of 5`}
                                                title={`${star} out of 5`}
                                                className="text-slate-300 transition hover:scale-110 hover:text-amber-400"
                                            >
                                                <Star
                                                    className={`h-5 w-5 ${
                                                        star <= (ratings[resource.id] || 0)
                                                            ? "fill-amber-400 text-amber-400"
                                                            : ""
                                                    }`}
                                                />
                                            </button>
                                        ))}

                                        <span className="ml-2 text-xs text-slate-400">
                                            (overall)
                                        </span>
                                    </div>

                                    {/* Author and actions */}
                                    <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-slate-500">
                                            By{" "}
                                            <span className="font-semibold text-slate-700">
                                                {resource.author || "ReviewerHub User"}
                                            </span>
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {isPdf && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedResource(resource)
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#002147] px-4 py-2 text-sm font-semibold text-[#002147] transition hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Preview
                                                </button>
                                            )}

                                            <a
                                                href={resource.downloadUrl}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-[#003366]"
                                            >
                                                <Download className="h-4 w-4" />
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {filteredResources.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                                <Search className="mx-auto h-10 w-10 text-slate-300" />
                                <h3 className="mt-3 font-bold text-slate-800">
                                    No reviewers found
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Try another keyword or select a different college.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PDF preview modal */}
            {selectedResource && (
                <PdfPreview
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                />
            )}
        </main>
    );
}
