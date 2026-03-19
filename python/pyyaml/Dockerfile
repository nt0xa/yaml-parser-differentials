FROM python:slim
COPY main.py /usr/local/bin/yt
RUN pip install 'pyyaml>=6,<7'
RUN chmod +x /usr/local/bin/yt
ENTRYPOINT ["yt"]
