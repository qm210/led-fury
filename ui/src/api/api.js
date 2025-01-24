import {useQuery$} from "@preact-signals/query";
import axios from "axios";
import {queryClient} from "../index.jsx";
import {backendBroken} from "../signals/backend.js";
import {useMemo} from "react";
import {asFormData} from "../utils/fileDialog.js";


axios.interceptors.request.use(
    config => {
        // makeshift proxy
        if (config.url.startsWith("/")) {
            config.url = "http://localhost:8888/api" + config.url;
        }
        return config;
    }
);

axios.interceptors.response.use(
    response => response,
    async (error) => {
        if (axios.isAxiosError(error)) {
            if (error.code === "ERR_NETWORK") {
                backendBroken.value = true;
            }
            throw error;
        }
        return {
            data: {},
            error
        };
    }
);

export const useOverallState = (options = {}) => {
    const stateQuery = useQuery$(() => ({
        queryKey: ["overall", "state"],
        queryFn: () => axios.get("/overall/state"),
        suspense: true,
        suspenseBehavior: "suspense-eagerly",
        ...options,
    }));

    // currently just for debug, thus not enabled.
    const runQuery = useQuery$(() => ({
        queryKey: ["overall", "runs"],
        queryFn: () => axios.get("/overall/run"),
        enabled: false
    }));
    
    return useMemo(() => {
        return {
            isError: stateQuery.isError,
            isFetching: stateQuery.isFetching,
            state: stateQuery.data?.data,
            refetch: stateQuery.refetch,
            fetchRuns: runQuery.refetch
        };
    }, [stateQuery, stateQuery.isFetching, runQuery.refetch]);
};

export const useOverallOptions = () =>
    useQuery$(() => ({
        queryKey: ["options"],
        queryFn: () => axios.get("/overall/options"),
        staleTime: Infinity
    }));

export const useSequenceApi = (options = {}) => {
    const query = useQuery$(() => ({
        queryKey: ["sequence"],
        queryFn: () => axios.get("/sequence"),
        ...options,
    }));

    const start = () => axios.post("/sequence/start");

    const stop = () => axios.post("/sequence/stop");

    const seek = (second) =>
        axios.post("/sequence/seek", {second});

    return {
        current: query.data?.data,
        readCurrent: query.refetch,
        start: start.mutateAsync,
        stop,
        seek,
    };
};

export const invalidateOverall = () =>
    queryClient.invalidateQueries({queryKey: ["overall"]});

export const postPatternEdits = (patternEdits) =>
    axios.post("/patterns/edits", patternEdits);

export const importGifPattern = async ({files, renderSecond}) => {
    // "file" must come from e.g. document.getElementById('fileInput').files[0];
    const formData = asFormData(files);
    formData.append('renderSecond', renderSecond);
    const response = await axios.post("/patterns/gif", formData);
    if (response.status >= 400) {
        console.warn("GIF Import failed",  response);
        return;
    }
    return response.data;
};

export const usePatternApi = (patternId = undefined) => {
    const {refetch} = useOverallState();

    const patternPath = (id) => ["/pattern", id].join("/");

    const deletePattern = async (id) => {
        await axios.delete(patternPath(id));
        await refetch();
    };

    const patchPattern = async (id, body) => {
        await axios.patch(patternPath(id), body);
        await refetch();
        // <-- looked better than before:
        // await queryClient.invalidateQueries();
    }

    const patch = async (body) => {
        if (!patternId) {
            throw Error("can only use usePatternApi(id).patch() if given that id :D");
        }
        return patchPattern(patternId, body);
    };


    return {
        patchPattern,
        patch,
        deletePattern
    };
};


export const updateGeometry = async (segments) => {
    // useQuery$ and useMutation$ always want to do more than necessary,
    // i.e. just do it on our own, non-caching, deterministic way.
    try {
        const response = await axios.post("/geometry", segments);
        return {
            segments: response.data.segments,
            geometry: response.data.geometry,
            error: null
        };
    } catch (error) {
        return {error};
    }
};

export const storeToFile = (filename = "") =>
    axios.post("/store", {filename});

export const shutdownBackend = () =>
    axios.post("/shutdown");
