import {useMutation$, useQuery$} from "@preact-signals/query";
import axios from "axios";
import {backendBroken} from "../signals/app.js";


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

export const useOverallState = (options = {}) =>
    useQuery$(() => ({
        queryKey: ["overall/state"],
        queryFn: () => axios.get("/overall/state"),
        suspense: true,
        suspenseBehavior: "suspense-eagerly",
        ...options,
    }));

export const useOverallRuns = (options = {}) =>
    useQuery$(() => ({
        queryKey: ["overall/run"],
        queryFn: () => axios.get("/overall/run"),
        ...options,
    }));

export const useOverallOptions = () =>
    useQuery$(() => ({
        queryKey: ["overall/options"],
        queryFn: () => axios.get("/overall/options"),
        staleTime: Infinity
    }));

export const useSequenceApi = (options = {}) => {
    const query = useQuery$(() => ({
        queryKey: ["sequence"],
        queryFn: () => axios.get("/sequence"),
        ...options,
    }));

    const start = useMutation$(() => ({
        mutationFn: () => axios.post("/sequence/start"),
    }));

    const stop = useMutation$(() => ({
        mutationFn: () => axios.post("/sequence/stop"),
    }));

    const seek = useMutation$(() => ({
        mutationFn: (second) => axios.post("/sequence/seek", {second})
    }))

    return {
        current: query.data?.data,
        readCurrent: query.refetch,
        start: start.mutateAsync,
        stop: stop.mutateAsync,
        seekTime: seek.mutateAsync,
    };
};

export const postPatternEdits = (patternEdits) =>
    axios.post(
        `/pattern/edits`,
        patternEdits
    );

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
