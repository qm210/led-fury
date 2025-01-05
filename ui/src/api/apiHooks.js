import {useMutation$, useQuery$} from "@preact-signals/query";
import axios from "axios";


export const useAllTheStuff = (options = {}) =>
    useQuery$(() => ({
        queryKey: ["overall-state"],
        queryFn: () => axios.get("/overall-state"),
        ...options,
    }));


export const useSequence = (options = {}) => {
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


export const useGetPatterns = () =>
    useQuery$(() => ({
        queryKey: ["patterns"],
        queryFn: () => axios.get("/patterns"),
    }));

export const usePostPattern = () =>
    useQuery$(() => ({
        queryKey: ["patterns"],
        queryFn: () => axios.get("/patterns"),
    }));

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
