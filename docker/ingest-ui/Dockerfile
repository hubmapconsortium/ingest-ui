# Parent image
FROM hubmap/api-base-image:1.2.0

LABEL description="HuBMAP Ingest UI"

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Copy from host to image
COPY . .

# Set up the repository file for the stable version of
# nginx which dnf should use (in the legacy "yum" location.)
RUN set -eux && \
    cat <<'EOF' > /etc/yum.repos.d/nginx.repo
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
EOF

# Reduce the number of layers in image by minimizing the number of separate RUN commands
# 1 - Install nginx (using the custom yum repo specified earlier)
# 2 - Remove the default nginx config file
# 3 - Overwrite the nginx.conf with ours to run nginx as non-root
# 4 - Use our nginx config file for ingest-ui
# 5 - Make the start.sh executable
# 6 - Clean the dnf/yum cache and other locations to reduce Docker Image layer size
RUN dnf install -y nginx && \
    [ ! -f /etc/nginx/conf.d/default.conf ] || mv /etc/nginx/conf.d/default.conf /tmp/etc_nginx_conf.d_default.conf.ORIGINAL && \
    [ ! -f /etc/nginx/nginx.conf ] || mv /etc/nginx/nginx.conf /tmp/etc_nginx_nginx.conf.ORIGINAL && \
    mv nginx.conf /etc/nginx/nginx.conf && \
    mv ingest-ui.conf /etc/nginx/conf.d && \
    [ ! -d nginx ] || mv nginx /tmp/nginx_from_WORKDIR && \
    chmod +x start.sh && \
    dnf clean all && \
    rm -rf /var/cache/dnf \
        /var/log/dnf \
         /var/log/yum \
         /root/.cache
    
# Change to source code directory
WORKDIR /usr/src/app/src

# Reduce the number of layers in image by minimizing the number of separate RUN commands
# 1 - Download and install nvm:
# 2 - In lieu of restarting the shell
# 3 - Download and install Node.js v24
# 4 - Update npm to the latest version
# 5 - Install dependencies and generate static production bundle with our custom tags
# 6 - Delete node_modules to reduce image size
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
    \. "$HOME/.nvm/nvm.sh" && \
    nvm install 24 && \
    npm install npm@latest -g && \
    npm install && \
    npm run build:tags && \
    rm -rf node_modules

# The EXPOSE instruction informs Docker that the container listens on the specified network ports at runtime. 
# Here 8080 for nginx to serve the React generated static build
EXPOSE 8080

# Set an entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Change directory
WORKDIR /usr/src/app

CMD ["./start.sh"]
