# Parent image
FROM centos:7

LABEL description="HuBMAP Ingest API Service" \
	version="1.4"

# Change to directory that contains the Dockerfile
WORKDIR /usr/src/app

# Copy from host to image
COPY . .

# Reduce the number of layers in image by minimizing the number of separate RUN commands
# 1 - Update the package listings
# 2 - Install git for pulling HuBMAP commons from github
# 3 - Install Extra Packages for Enterprise Linux (EPEL) 
# 4 - Use the EPEL repo for installing python, pip, uwsgi, uwsgi python plugin
# 5 - Upgrade pip, after upgrading, both pip and pip3 are the same version
# 6 - Install flask app dependencies with pip (pip3 also works)
# 7 - Clean all yum cache
RUN yum update -y && \
    yum install -y git && \
    yum install -y epel-release && \
    yum install -y python36 python36-pip uwsgi uwsgi-plugin-python36.x86_64 && \
    pip3 install --upgrade pip && \
    pip install -r src/requirements.txt && \
    yum clean all 

# The EXPOSE instruction informs Docker that the container listens on the specified network ports at runtime. 
# EXPOSE does not make the ports of the container accessible to the host.
EXPOSE 5000

# Finally, we run uWSGI with the ini file
CMD [ "uwsgi", "--ini", "/usr/src/app/src/uwsgi.ini" ]