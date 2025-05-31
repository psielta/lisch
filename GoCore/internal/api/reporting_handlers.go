package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (api *Api) handleGetWeatherForecast(w http.ResponseWriter, r *http.Request) {
	// 1. Lê a base URL da .env
	baseURL := os.Getenv("GOBID_FAST_API")
	if baseURL == "" {
		http.Error(w, "GOBID_FAST_API não configurado", http.StatusInternalServerError)
		return
	}

	// 2. Monta a URL completa (assegurando-se de não duplicar '/')
	url := fmt.Sprintf("%s/WeatherForecast/GetReport", strings.TrimRight(baseURL, "/"))

	// 3. Cria a requisição GET usando o mesmo contexto (para timeouts, cancelamentos, etc)
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, url, nil)
	if err != nil {
		http.Error(w, "erro ao criar requisição externa: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 4. Executa a chamada para a API .NET
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "erro ao chamar API de relatórios: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 5. Se a API .NET retornar erro (ex: 404), repassa o status e o body
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	}

	// 6. Copia os headers de conteúdo (Content-Type, Content-Disposition, etc)
	for key, vals := range resp.Header {
		for _, v := range vals {
			w.Header().Add(key, v)
		}
	}

	// 7. Escreve o status 200 e copia o PDF para o ResponseWriter
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, resp.Body)
}
func (api *Api) handleGetReportPedido(w http.ResponseWriter, r *http.Request) {
	// 1. Lê a base URL da .env
	baseURL := os.Getenv("GOBID_FAST_API")
	if baseURL == "" {
		http.Error(w, "GOBID_FAST_API não configurado", http.StatusInternalServerError)
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "ID do pedido não fornecido", http.StatusBadRequest)
		return
	}

	// 2. Monta a URL completa (assegurando-se de não duplicar '/')
	url := fmt.Sprintf("%s/Pedido/GetReportPedidoById/%s", strings.TrimRight(baseURL, "/"), id)

	api.Logger.Info("URL: " + url)

	// 3. Cria a requisição GET usando o mesmo contexto (para timeouts, cancelamentos, etc)
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, url, nil)
	if err != nil {
		http.Error(w, "erro ao criar requisição externa: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 4. Executa a chamada para a API .NET
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "erro ao chamar API de relatórios: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 5. Se a API .NET retornar erro (ex: 404), repassa o status e o body
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	}

	// 6. Copia os headers de conteúdo (Content-Type, Content-Disposition, etc)
	for key, vals := range resp.Header {
		for _, v := range vals {
			w.Header().Add(key, v)
		}
	}

	// 7. Escreve o status 200 e copia o PDF para o ResponseWriter
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, resp.Body)
}
