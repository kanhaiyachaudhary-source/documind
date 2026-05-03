import axios from "axios";

const api = axios.create({ baseURL: "", timeout: 90000 });

export interface DocumentMetadata {
  doc_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  page_count: number | null;
  chunk_count: number;
  uploaded_at: string;
  text_preview: string;
}

export const documentApi = {
  upload: async (file: File): Promise<{ doc_id: string; metadata: DocumentMetadata }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  delete: async (doc_id: string) => api.post("/api/delete", { doc_id }),
};

export const aiApi = {
  extract: (doc_id: string) => api.post("/api/extract", { doc_id }).then((r) => r.data),
  classify: (doc_id: string) => api.post("/api/classify", { doc_id }).then((r) => r.data),
  summarize: (doc_id: string) => api.post("/api/summarize", { doc_id }).then((r) => r.data),
  ask: (doc_id: string, question: string, history: any[] = []) =>
    api.post("/api/qa", { doc_id, question, history }).then((r) => r.data),
};
