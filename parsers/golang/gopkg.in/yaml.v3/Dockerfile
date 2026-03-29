FROM golang:latest
COPY . /src
WORKDIR /src
RUN go build -o /usr/local/bin/yt .
ENTRYPOINT ["yt"]
