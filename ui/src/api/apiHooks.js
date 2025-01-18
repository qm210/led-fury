import {useMutation$, useQuery$} from "@preact-signals/query";
import axios from "axios";
import {useEffect} from "preact/hooks";
import {useState} from "react";


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
};

export const useGeometryApi = () => {
    const getGeometry = useQuery$(() => ({
        queryKey: ["geometry"],
        queryFn: () => axios.get("/geometry"),
    }));

    const {mutateAsync: postSegments} = useMutation$(() => ({
        mutationFn: (segment) => axios.post("/geometry", {segment})
    }));

    return {
        getGeometry,
        postSegments
    };
};

export const useSegmentGeometry = (segments) => {
    // useQuery$ / useMutation$ showed weird behaviour, so implement own.
    // This does not use a "pending" because no need - it is a direct result of a segment change.

    const [state, setState] = useState({
        segments,
        geometry: null,
        error: null,
    });

    useEffect(() => {
        if (!segments) {
            return;
        }
        axios.post("/geometry", segments)
            .then(res => {
                console.log("Segments", segments, "-> Geometry", res.data ?? res);
                setState({
                    segments,
                    geometry: res.data,
                    error: null
                });
            }).catch(error =>
            setState(state => ({
                ...state,
                error
            })));
    }, [segments]);

    return state;
};
