import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import NotFound from "./404";
import { entity_api_get_entity } from "../service/entity_api";
import { getEntityRoutePath } from "./ui/formParts";

export function getEntityIdFromPath(pathname) {
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const candidateId = pathParts[pathParts.length - 1];

  if (!candidateId) {
    return null;
  }

  try {
    return decodeURIComponent(candidateId);
  } catch (e) {
    return candidateId;
  }
}

export function getCanonicalEntityPath(entity, requestedId) {
  if (!entity?.entity_type || !requestedId) {
    return null;
  }

  return getEntityRoutePath(entity.entity_type, requestedId);
}

export function EntityRedirectResolver() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notFoundId, setNotFoundId] = useState(null);
  const [isResolving, setIsResolving] = useState(true);
  const entityID = getEntityIdFromPath(location.pathname);

  useEffect(() => {
    let ignore = false;
    let didNavigate = false;

    if (!entityID) {
      setNotFoundId(null);
      setIsResolving(false);
      return () => {
        ignore = true;
      };
    }

    setIsResolving(true);
    setNotFoundId(null);

    entity_api_get_entity(entityID)
      .then((response) => {
        if (ignore) return;

        if (response.status === 200 && response.results) {
          const canonicalPath = getCanonicalEntityPath(response.results, entityID);

          if (canonicalPath) {
            didNavigate = true;
            navigate(canonicalPath, { replace: true });
            return;
          }
        }

        setNotFoundId(entityID);
      })
      .catch(() => {
        if (!ignore) {
          setNotFoundId(entityID);
        }
      })
      .finally(() => {
        if (!ignore && !didNavigate) {
          setIsResolving(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [entityID, navigate]);

  if (isResolving) {
    return null;
  }

  return <NotFound entityID={notFoundId || entityID} />;
}
