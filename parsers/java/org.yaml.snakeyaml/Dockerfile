FROM amazoncorretto:21
COPY . /src
WORKDIR /src
RUN curl -o snakeyaml.jar https://repo1.maven.org/maven2/org/yaml/snakeyaml/2.6/snakeyaml-2.6.jar
RUN javac -cp snakeyaml.jar Main.java
COPY yt /usr/local/bin/
ENTRYPOINT ["yt"]
