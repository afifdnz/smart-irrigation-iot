package httputil

import (
	"net/http"
	"strconv"
)

func ParseIDFromPath(r *http.Request, key string) (int, error) {
	idStr := r.PathValue(key)
	return strconv.Atoi(idStr)
}

func ParsePagination(r *http.Request) (limit, offset int) {
	limit = 20
	offset = 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err != nil && val > 0 {
			limit = val
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if val, err := strconv.Atoi(o); err != nil && val >= 0 {
			offset = val
		}
	}
	return
}
