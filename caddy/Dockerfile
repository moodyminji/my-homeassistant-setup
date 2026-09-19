# Stock Caddy has no DNS-provider modules; the DuckDNS one is needed for the
# DNS-01 challenge (a certificate for a name that only resolves on the LAN).
FROM caddy:2-builder AS build
RUN xcaddy build --with github.com/caddy-dns/duckdns

FROM caddy:2
COPY --from=build /usr/bin/caddy /usr/bin/caddy
