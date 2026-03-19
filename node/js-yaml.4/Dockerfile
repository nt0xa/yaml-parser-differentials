FROM node:slim
RUN npm install -g js-yaml@4
ENV NODE_PATH=/usr/local/lib/node_modules
COPY main.js /usr/local/bin/yt
RUN chmod +x /usr/local/bin/yt
ENTRYPOINT ["yt"]
