from rest_framework.pagination import PageNumberPagination


class OptionalPageNumberPagination(PageNumberPagination):
    """Paginate only when the client asks for it with ?page= or ?page_size=.

    Without either parameter the endpoint returns a plain JSON list, so existing
    clients keep working; with them it returns {count, next, previous, results}.
    """

    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if (
            self.page_query_param not in request.query_params
            and self.page_size_query_param not in request.query_params
        ):
            return None

        return super().paginate_queryset(queryset, request, view)
