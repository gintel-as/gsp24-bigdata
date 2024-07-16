# Gintel summer project - Big Data

This summer project revolves around the readability and useability of the many logs produced at Gintel. With logs containing useful data scattered around their many servers, the only way to inspect them is to manually retrieve each log, and open them individually in Notepad or similar tools. Gintel envisions a solution where all logs are automatically stored in a centralized engine. This would make the logs more easily accessible for developers to debug, and facilitate the generation of aggregated statistics for better insights and analysis.


# Prerequisites
- Docker Desktop or docker+docker compose


# Project Structure
The project is divided into 2 parts, the ELK stack and the Web App.

### ELK

The ELK stack consists of Logstash, Elasticsearch, and Kibana.

- **Logstash**: Processes and transforms log data from various sources before sending it to Elasticsearch.
- **Elasticsearch**: Stores and indexes log data for fast search and retrieval.
- **Kibana**: A UI to visualize and analyze log data stored in Elasticsearch through dashboards and graphs.


 ### Web App
 (Because we wanted more flexibility in the way we vizualize the log data, we decided to work on an Angular web application that is connected to our Elasticsearch engine through a node js server.)
 The web app has 3 pages:
 - **Kibana**: A page to demonstrate a way of accessing Kibana via a the web app. Not really in use. Would reccomend just visiting Kibana directly.
 - **Logs**: This page allows users to search for a session ID and view, as well as filter, all log entries across different log types that include the specified session ID.
 - **Call List**: This page generates a list of calls and their corresponding session tree.
 

# Setup

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/gintel-as/gsp24-bigdata.git
    ```
2. **Input your data**:

    Drop your data in elk/logstash_ingest_data folder. Make sure the logstash pipelines are configured correctly.


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

Kibana will be available at http://localhost:5601 by default. 

The webapp will be available at http://localhost:4200 by default.

# Quick Kibana Guide

# Introduction
Kibana is a powerful visualization and exploration tool used to analyze log data stored in Elasticsearch.

## Accessing Kibana
1. **Open Kibana**: Visit [http://localhost:5601](http://localhost:5601).
2. **Login**: Enter your credentials to log in to Kibana (default: `elastic/changeme`).

## Viewing Indexes
1. **Go to the Management tab**.
2. **Navigate to Index Management**.
3. **Verify that an Index has been created**:  
   ![Index Created](https://github.com/user-attachments/assets/8caecc7e-e1f1-49fe-b653-70169d8e35b2)

## Creating a Data View
1. **Navigate to Data Views** in the Management/Kibana tab.
2. **Create a New Data View**.
3. **Select a parsed timestamp as the Timestamp field**.
4. **Save the Data View to Kibana**.

## Viewing Data
1. **Navigate to Discover** under the Analytics tab.
2. **Search, filter, and analyze your logs**.

## Creating Visualizations
1. **Navigate to Dashboards** under the Analytics tab.
2. **Create a new dashboard** and start creating visualizations.





