import {useMutation$, useQuery$} from "@preact-signals/query";
import axios from "axios";


axios.interceptors.request.use(
    config => {
        // makeshift proxy
        if (config.url.startsWith("/")) {
            config.url = "http://localhost:8888/api" + config.url;
        }
        return config;
    }
);

export const useOverallState = (options = {}) =>
    useQuery$(() => ({
        queryKey: ["overall/state"],
        queryFn: () => axios.get("/overall/state"),
        ...options,
    }));

export const useOverallRuns = (options = {}) =>
    useQuery$(() => ({
        queryKey: ["overall/run"],
        queryFn: () => axios.get("/overall/run"),
        ...options,
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

    return {
        current: query.data?.data,
        readCurrent: query.refetch,
        start: start.mutateAsync,
        stop: stop.mutateAsync,
    };
};

export const usePatternApi = () => {
    const getAll = useQuery$(() => ({
        queryKey: ["patterns"],
        queryFn: () => axios.get("/patterns"),
    }));

    const postEdits = useMutation$(() => ({
        mutationFn: (patternEdits) => axios.post(
            `/pattern/edits`,
            patternEdits
        ),
    }));

    return {
        postPatternEdits: postEdits.mutateAsync
    }
};

export const useOverallMutations = () => {
    const {mutateAsync: storeToFile} = useMutation$(() => ({
        mutationFn: (filename = "") => axios.post("/store", {filename})
    }));

    const {mutateAsync: shutdown} = useMutation$(() => ({
        mutationFn: () => axios.post("/shutdown")
    }));

    return {
        storeToFile,
        shutdown
    };
}
