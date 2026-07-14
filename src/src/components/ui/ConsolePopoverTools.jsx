import { useEffect } from "react";

export default function ConsolePopoverTools({ setAPIErrQueue }) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const previousPopoverTools = window.HuBMAPPopovers;
    const previousMockApiErrorPopover = window.mockApiErrorPopover;

    function apiError({
      title = "API Error - Mock",
      details = "Mock API error details triggered from the browser console.",
      extra = "Console-triggered mock API failure",
      hidePrefix = false,
    } = {}) {
      const nextError = [title, details, extra];
      if (hidePrefix) nextError[3] = true;
      setAPIErrQueue((prev) => [...prev, nextError]);
      return nextError;
    }

    function mockApiError() {
      return apiError();
    }

    window.HuBMAPPopovers = {
      ...(previousPopoverTools || {}),
      apiError,
      mockApiError,
    };
    window.mockApiErrorPopover = mockApiError;

    return () => {
      if (window.HuBMAPPopovers?.apiError === apiError) {
        if (previousPopoverTools) {
          window.HuBMAPPopovers = previousPopoverTools;
        } else {
          delete window.HuBMAPPopovers;
        }
      }
      if (window.mockApiErrorPopover === mockApiError) {
        if (previousMockApiErrorPopover) {
          window.mockApiErrorPopover = previousMockApiErrorPopover;
        } else {
          delete window.mockApiErrorPopover;
        }
      }
    };
  }, [setAPIErrQueue]);

  return null;
}
