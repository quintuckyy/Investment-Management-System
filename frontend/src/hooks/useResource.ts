import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import { parseApiError } from "../utils/errors";
import type { ParsedApiError } from "../utils/errors";

/**
 * Load a list endpoint and expose create / update / delete helpers.
 * Save and remove return an error (instead of throwing) so forms can show it;
 * after a successful change the list is fetched again.
 */
export function useResource<T extends { id: number }>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiClient.get<T[]>(endpoint);

        if (!cancelled) {
          setItems(response.data);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(parseApiError(error, "Failed to load data.").message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [endpoint, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const save = useCallback(
    async (
      payload: Record<string, unknown>,
      id?: number
    ): Promise<ParsedApiError | null> => {
      try {
        if (id) {
          await apiClient.patch(`${endpoint}${id}/`, payload);
        } else {
          await apiClient.post(endpoint, payload);
        }

        reload();
        return null;
      } catch (error) {
        return parseApiError(error, "Failed to save changes.");
      }
    },
    [endpoint, reload]
  );

  const remove = useCallback(
    async (id: number): Promise<ParsedApiError | null> => {
      try {
        await apiClient.delete(`${endpoint}${id}/`);
        reload();
        return null;
      } catch (error) {
        return parseApiError(error, "Failed to delete this record.");
      }
    },
    [endpoint, reload]
  );

  return { items, loading, loadError, reload, save, remove };
}
