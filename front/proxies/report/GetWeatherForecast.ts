import api from "@/lib/api";

export const getWeatherForecast = async (): Promise<Blob> => {
  const response = await api.get("/reporting/GetWeatherForecast", {
    responseType: "blob",  // essencial para tratar como PDF binário
  });
  return response.data;
};
