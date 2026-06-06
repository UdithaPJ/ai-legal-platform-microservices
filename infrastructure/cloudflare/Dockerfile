FROM cloudflare/cloudflared:latest

COPY --chown=65532:65532 --chmod=644 cloudflared-config.yml /home/nonroot/cloudflared-config.yml
COPY --chown=65532:65532 --chmod=644 tunnel-credentials.json /home/nonroot/tunnel-credentials.json
