# Gintel summer project - Big Data

Originally forked from [Elk Ninja](https://github.com/elkninja/elastic-stack-docker-part-one)

This summer project revolves around the readability and useability of the many logs produced at Gintel. With logs containing useful data scattered around their many servers, the only way to inspect them is to manually retrieve each log, and open them individually in Notepad or similar tools. Gintel envisions a solution where all logs are automatically stored in a centralized engine. This would make the logs more easily accessible for developers to debug, and facilitate the generation of aggregated statistics for better insights and analysis.

Visit the [wiki](https://github.com/gintel-as/gsp24-bigdata/wiki) for more info.


# Prerequisites
- Docker Desktop or docker+docker compose


# Setup

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/gintel-as/gsp24-bigdata.git
    ```
2. **Input your data**:

    Drop your data in elk/logstash_ingest_data folder. Make sure the logstash pipelines are configured correctly. Check out this [wiki page](https://github.com/gintel-as/gsp24-bigdata/wiki/Logstash-Pipelines) for more guidance.


2. **Navigate to the Project Directory**:

    ```bash
    cd gsp24-bigdata
    ```

3. **Build and Start the Containers**:

    ```bash
    docker compose up --build
    ```

4. **Wait for All Containers to Set Up**:
    - The setup process will take a few minutes. Monitor the logs in the terminal to track the progress.

Kibana will be available at http://localhost:5601 by default. Visit our [Kibana Guide](https://github.com/gintel-as/gsp24-bigdata/wiki/Kibana-Guide) for quick introduction to Kibana.

The webapp will be available at http://localhost:4200 by default. Visit our [Web App Guide](https://github.com/gintel-as/gsp24-bigdata/wiki/Web-App-Guide) for more guidance.
