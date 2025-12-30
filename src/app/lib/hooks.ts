import { useCallback, useState } from "react";

const API_BASE_URL = "https://federatedserver.up.railway.app";

interface AggregateResponse {
  status: "success" | "error";
  message?: string; // Only present in error case
  method?: string; // "FedAvg" in success case
  num_clients?: number;
  num_layers?: number;
  saved?: string;
  avg_global_weight?: number;
  avg_global_weight_change_percent?: number;
  client_mean_weight?: Record<string, number>;
  client_mean_weight_percentage?: Record<string, number>;
}

interface FileEntry {
  client: string;
  message: string;
  name: string;
  timestamp: string;
}

interface LogEntry {
  files: FileEntry[];
  message: string;
  status: number;
}

interface UploadResponse {
  message: string;
  modelId: string;
}

export interface ModelMetrics {
  best_accuracy: number | null;
  history: string[];
}

interface GlobalModelResponse {
  model: Blob;
  version: string;
}

export const useAggregate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aggregate = useCallback(async (): Promise<AggregateResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Mengirim permintaan agregasi FedAvg ke server...");
      const response = await fetch(`${API_BASE_URL}/aggregate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Provide user-friendly error messages based on status code
        let errorMessage = "";

        switch (response.status) {
          case 400:
            errorMessage = "Tidak dapat melakukan agregasi. Pastikan minimal 2 model sudah diupload dari client.";
            break;
          case 404:
            errorMessage = "Endpoint agregasi tidak ditemukan. Periksa konfigurasi server.";
            break;
          case 500:
            errorMessage = "Terjadi kesalahan saat agregasi di server. Silakan coba lagi nanti.";
            break;
          case 503:
            errorMessage = "Server sedang tidak tersedia. Silakan coba lagi dalam beberapa saat.";
            break;
          default:
            errorMessage = `Gagal melakukan agregasi (Error ${response.status}). Silakan coba lagi.`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("\n Respons server:");
      console.log(data);
      return data;
    } catch (err) {
      // If error is from network/fetch failure (not HTTP error)
      if (err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { aggregate, loading, error };
};

export const useLogs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLogs = useCallback(async (): Promise<LogEntry | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getLogs, loading, error };
};

export const useUploadModel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadModelMultipart = useCallback(
    async (
      file: File,
      clientName: string,
      metrics?: ModelMetrics
    ): Promise<UploadResponse | null> => {
      const formData = new FormData();

      // Match Python script format: file field named "file", with client and timestamp
      formData.append("file", file);
      formData.append("client", clientName);
      formData.append("timestamp", new Date().toISOString());

      // Add metrics if provided
      if (metrics) {
        formData.append("metrics", JSON.stringify(metrics));
      }

      try {
        const response = await fetch(`${API_BASE_URL}/upload-model`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const uploadModelJsonBase64 = useCallback(
    async (
      file: File,
      clientName: string,
      metrics?: ModelMetrics
    ): Promise<UploadResponse | null> => {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 string
          const base64String = result.split(",")[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const payload: any = {
        client: clientName,
        compressed_weights: base64,
        timestamp: new Date().toISOString(),
      };

      // Add metrics if provided (matching Python script format)
      if (metrics) {
        payload.metrics = metrics;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/upload-model`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const uploadModel = useCallback(
    async (
      file: File,
      clientName: string,
      uploadMethod: "json" | "multipart" | "auto" = "auto",
      metrics?: ModelMetrics
    ): Promise<UploadResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        // Auto mode: Try JSON first, fallback to multipart on 415 error
        if (uploadMethod === "auto" || uploadMethod === "json") {
          try {
            const result = await uploadModelJsonBase64(file, clientName, metrics);
            return result;
          } catch (jsonErr: any) {
            console.log(
              `JSON upload failed for ${file.name}:`,
              jsonErr
            );

            // If explicitly JSON mode, don't fallback
            if (uploadMethod === "json") {
              throw jsonErr;
            }

            // In auto mode, check if it's a 415 error, then try multipart
            if (jsonErr?.message?.includes("415") || jsonErr?.message?.includes("Unsupported Media Type")) {
              console.log("Falling back to multipart...");
              return await uploadModelMultipart(file, clientName, metrics);
            }

            throw jsonErr;
          }
        } else {
          // Use multipart directly
          return await uploadModelMultipart(file, clientName, metrics);
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [uploadModelMultipart, uploadModelJsonBase64]
  );

  return { uploadModel, loading, error };
};

export const useDownloadGlobal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadGlobal =
    useCallback(async (): Promise<GlobalModelResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/download-global`, {
          method: "GET",
        });

        if (!response.ok) {
          // Provide user-friendly error messages based on status code
          let errorMessage = "";

          switch (response.status) {
            case 404:
              errorMessage = "Model global belum tersedia. Silakan upload model dari client terlebih dahulu atau lakukan agregasi.";
              break;
            case 500:
              errorMessage = "Terjadi kesalahan di server. Silakan coba lagi nanti.";
              break;
            case 503:
              errorMessage = "Server sedang tidak tersedia. Silakan coba lagi dalam beberapa saat.";
              break;
            default:
              errorMessage = `Gagal mengunduh model (Error ${response.status}). Silakan coba lagi.`;
          }

          throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const version = response.headers.get("X-Model-Version") || "unknown";

        return {
          model: blob,
          version,
        };
      } catch (err) {
        // If error is from network/fetch failure (not HTTP error)
        if (err instanceof TypeError) {
          setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
        } else {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui");
        }
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  return { downloadGlobal, loading, error };
};
