import {useRef, useState} from "react";
import {useEffect} from "preact/hooks";

export const useComponentDimensions = () => {
    const [dimensions, setDimensions] = useState({width: 0, height: 0});
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            setDimensions({
                width: ref.current.offsetWidth,
                height: ref.current.offsetHeight
            });
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (ref.current) {
                setDimensions({
                    width: ref.current.offsetWidth,
                    height: ref.current.offsetHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {ref, dimensions};
};