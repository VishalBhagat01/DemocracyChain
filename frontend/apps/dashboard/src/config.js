export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
  mlUrl: import.meta.env.VITE_ML_URL || 'http://localhost:8001',
  graphUrl: import.meta.env.VITE_GRAPH_URL || 'http://localhost:8002',
};
