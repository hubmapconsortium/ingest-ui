# Parent image
FROM hubmap/api-base-image:latest

LABEL description="HuBMAP Ingest UI"

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Copy from host to image
COPY . .

# Nginx package from EPEL is old, we create a new repository file to install the latest mainline version of Nginx
RUN echo $'[nginx-mainline]\n\
name=nginx mainline repo\n\
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/\n\
gpgcheck=0\n\
enabled=1\n'\
>> /etc/yum.repos.d/nginx.repo

# Reduce the number of layers in image by minimizing the number of separate RUN commands
# 1 - Install nginx (using the custom yum repo specified earlier)
# 2 - Remove the default nginx config file
# 3 - Overwrite the nginx.conf with ours to run nginx as non-root
# 4 - Use our nginx config file
# 5 - Add Node.js stable release Yum Repository
# 6 - Install Node.js (includes npm)
# 7 - Install npm dependencies
# 8 - Clean all yum cache
RUN yum install -y nginx && \
    rm /etc/nginx/conf.d/default.conf && \
    mv nginx.conf /etc/nginx/nginx.conf && \
    mv ingest-ui.conf /etc/nginx/conf.d && \
    curl -sL https://rpm.nodesource.com/setup_12.x | bash - && \
    yum install -y nodejs && \
    npm install && \
    yum clean all
    
# Change to source code directory
WORKDIR /usr/src/app/src

# Install npm dependencies and generate static site
RUN npm install && \
    npm run build

# The EXPOSE instruction informs Docker that the container listens on the specified network ports at runtime. 
# EXPOSE does not make the ports of the container accessible to the host.
# Here 80 for nginx to serve the react generated static site
EXPOSE 80

# Set an entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]