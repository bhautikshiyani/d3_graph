import { useEffect, useState } from "react";

// Define the type for the ref
export const useContainerDimensions = (myRef: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const getDimensions = () => ({
      width: myRef.current ? myRef.current.offsetWidth : 0,
      height: myRef.current ? myRef.current.offsetHeight : 0,
    });

    const handleResize = () => {
      setDimensions(getDimensions());
    };

    if (myRef.current) {
      setDimensions(getDimensions());
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [myRef]);

  return dimensions;
};
